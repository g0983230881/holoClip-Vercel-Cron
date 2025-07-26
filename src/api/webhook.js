const crypto = require('crypto');
const { Receiver } = require('@upstash/qstash');
const { parseStringPromise } = require('xml2js');
const { fetchVideoDetails } = require('../processors/videoProcessor');
const { upsertVideo, upsertShort } = require('../database/videoManager');
const { getChannelById } = require('../database/channelManager');

const HUB_SECRET = process.env.YOUTUBE_HUB_SECRET;

// Helper to get raw body from request
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

function verifySignature(signature, payload) {
  if (!signature || !payload) return false;
  const hmac = crypto.createHmac('sha1', HUB_SECRET);
  hmac.update(payload);
  const expectedSignature = `sha1=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

async function processNotification(xmlBody) {
  try {
    const result = await parseStringPromise(xmlBody, { explicitArray: false });
    const entry = result.feed.entry;

    if (!entry) {
      console.log('Notification is not a video update. Ignoring.');
      return;
    }

    const videoId = entry['yt:videoId'];
    const channelId = entry['yt:channelId'];
    console.log(`Processing notification for videoId: ${videoId}, channelId: ${channelId}`);

    const channelExists = await getChannelById(channelId);
    if (!channelExists) {
      console.log(`Received notification for a channel not in the database: ${channelId}. Ignoring.`);
      return;
    }

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
    console.error('Error processing notification:', error);
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    console.log('GET request received for verification.');
    console.log('Query parameters:', JSON.stringify(req.query, null, 2));
    const hubChallenge = req.query['hub.challenge'];
    const hubMode = req.query['hub.mode'];

    if (hubMode === 'subscribe' || hubMode === 'unsubscribe') {
      console.log(`Responding to ${hubMode} challenge with: "${hubChallenge}"`);
      res.status(200).send(hubChallenge);
    } else {
      res.status(400).send('Bad Request');
    }
  } else if (req.method === 'POST') {
    console.log('POST request received on webhook.');
    const rawBody = await getRawBody(req);
    const upstashSignature = req.headers['upstash-signature'];
    const googleSignature = req.headers['x-hub-signature'];

    let isVerified = false;
    let source = '';

    if (upstashSignature) {
      source = 'Upstash';
      const r = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      });
      isVerified = await r.verify({
        signature: upstashSignature,
        body: rawBody.toString(),
      }).catch(err => {
        console.error("Upstash signature verification error:", err);
        return false;
      });
    } else if (googleSignature) {
      source = 'Google';
      isVerified = verifySignature(googleSignature, rawBody);
    }

    if (!isVerified) {
      console.error(`Signature verification failed for source: ${source || 'Unknown'}.`);
      return res.status(403).send('Forbidden: Invalid signature.');
    }

    console.log(`Signature verified successfully for source: ${source}.`);
    res.status(204).send(); // Respond immediately

    // Process in background
    processNotification(rawBody.toString('utf-8')).catch(err => {
      console.error("Unhandled promise rejection in processNotification:", err);
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
  }
};