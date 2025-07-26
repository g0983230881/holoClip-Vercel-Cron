const express = require('express');
const crypto = require('crypto');
const { parseStringPromise } = require('xml2js');
const { fetchVideoDetails } = require('../processors/videoProcessor');
const { upsertVideo, upsertShort } = require('../database/videoManager');
const { getChannelById, upsertChannel } = require('../database/channelManager');
const { getChannelDetails } = require('../api/youtubeClient');

const router = express.Router();

const HUB_SECRET = process.env.YOUTUBE_HUB_SECRET; // Ensure this is set in your environment variables

// GET endpoint for PubSubHubbub subscription verification
router.get('/', (req, res) => {
  // --- Start of new detailed logging for debugging ---
  console.log('GET request received for verification.');
  console.log('Query parameters received:', JSON.stringify(req.query, null, 2));
  // --- End of new detailed logging ---

  const hubChallenge = req.query['hub.challenge'];
  const hubMode = req.query['hub.mode'];

  if (hubMode === 'subscribe' || hubMode === 'unsubscribe') {
    console.log(`Responding to ${hubMode} challenge with value: "${hubChallenge}"`);
    res.set('Content-Type', 'text/plain'); // Explicitly set content type for safety
    res.status(200).send(hubChallenge);
  } else {
    console.log('GET request received, but not a valid subscription challenge. Responding with 400.');
    res.status(400).send('Bad Request');
  }
});

// Asynchronous function to process the notification in the background
async function processNotification(xmlBody) {
  try {
    const result = await parseStringPromise(xmlBody, { explicitArray: false });
    const entry = result.feed.entry;

    if (!entry) {
      console.log('Notification is not a video update (e.g., channel metadata change). Ignoring.');
      return;
    }

    const videoId = entry['yt:videoId'];
    const channelId = entry['yt:channelId'];
    console.log(`Processing notification for videoId: ${videoId}, channelId: ${channelId}`);

    // --- Pre-check if channel exists in our database ---
    const channelExists = await getChannelById(channelId);
    if (!channelExists) {
      console.log(`Received notification for a channel not in the database: ${channelId}. Ignoring.`);
      return; // Stop processing if the channel is not tracked.
    }
    // --- End of pre-check ---

    const videoDetails = await fetchVideoDetails(videoId);

    if (videoDetails) {
      if (videoDetails.is_short) {
        await upsertShort(videoDetails);
      } else {
        await upsertVideo(videoDetails);
      }
      console.log(`Successfully processed and saved video: ${videoId}`);
    } else {
      console.log(`No details found for video ${videoId}, it might have been deleted.`);
    }
  } catch (error) {
    console.error('Error processing notification in background:', error);
  }
}

// POST endpoint for receiving notifications
router.post('/', (req, res) => {
  console.log('POST request received on webhook.');

  // 1. Verify the signature
  const signature = req.get('X-Hub-Signature');
  if (HUB_SECRET && !verifySignature(signature, req.rawBody)) {
    console.error('Signature verification failed.');
    // Respond immediately but do not process
    return res.status(403).send('Forbidden: Invalid signature.');
  }
  console.log('Signature verified successfully.');

  // 2. Respond to Google immediately to prevent timeouts and retries
  res.status(204).send();

  // 3. Process the notification in the background (fire-and-forget)
  processNotification(req.body).catch(err => {
    // This catch is a safety net, though errors are handled inside processNotification
    console.error("Unhandled promise rejection in processNotification:", err);
  });
});

function verifySignature(signature, payload) {
  if (!signature || !payload) return false;
  const hmac = crypto.createHmac('sha1', HUB_SECRET);
  hmac.update(payload); // payload is already a buffer from the verify function
  const expectedSignature = `sha1=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

module.exports = router;