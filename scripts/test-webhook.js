const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from the project root

const axios = require('axios');
const crypto = require('crypto');

// --- Configuration ---
// The target video ID for the test notification.
const TEST_VIDEO_ID = 'dQw4w9WgXcQ'; // A classic choice
// The channel ID associated with the video.
const TEST_CHANNEL_ID = 'UCuAXFkgsw1L7_PLuMiIe52g';
// Your ngrok URL or the public URL of your webhook.
// IMPORTANT: Replace this with your actual ngrok URL before running.
// const WEBHOOK_URL = 'http://localhost:3000/api/webhook'; // Default to localhost, but you should change this.
const WEBHOOK_URL = 'https://69d508ad9257.ngrok-free.app/api/webhook';

const HUB_SECRET = process.env.YOUTUBE_HUB_SECRET;

if (!HUB_SECRET) {
  console.error('Error: YOUTUBE_HUB_SECRET is not defined in your .env file.');
  process.exit(1);
}

// --- Main Function ---
async function sendTestNotification() {
  console.log(`Sending test notification for video ${TEST_VIDEO_ID} to ${WEBHOOK_URL}...`);

  // 1. Create the XML payload
  const xmlPayload = `
    <?xml version='1.0' encoding='UTF-8'?>
    <feed xmlns:yt='http://www.youtube.com/xml/schemas/2015' xmlns='http://www.w3.org/2005/Atom'>
      <link rel='hub' href='https://pubsubhubbub.appspot.com'/>
      <link rel='self' href='https://www.youtube.com/xml/feeds/videos.xml?channel_id=${TEST_CHANNEL_ID}'/>
      <title>YouTube video feed</title>
      <updated>${new Date().toISOString()}</updated>
      <entry>
        <id>yt:video:${TEST_VIDEO_ID}</id>
        <yt:videoId>${TEST_VIDEO_ID}</yt:videoId>
        <yt:channelId>${TEST_CHANNEL_ID}</yt:channelId>
        <title>A Test Video Title</title>
        <link rel='alternate' href='http://www.youtube.com/watch?v=${TEST_VIDEO_ID}'/>
        <author>
          <name>Test Channel</name>
          <uri>http://www.youtube.com/channel/${TEST_CHANNEL_ID}</uri>
        </author>
        <published>${new Date().toISOString()}</published>
        <updated>${new Date().toISOString()}</updated>
      </entry>
    </feed>
  `.trim();

  // 2. Generate the signature
  const hmac = crypto.createHmac('sha1', HUB_SECRET);
  hmac.update(xmlPayload, 'utf8');
  const signature = `sha1=${hmac.digest('hex')}`;

  // 3. Set up request headers
  const headers = {
    'Content-Type': 'application/atom+xml',
    'X-Hub-Signature': signature,
    'User-Agent': 'Google-PubSubHubbub/1.0', // Mimic Google's user agent
  };

  // 4. Send the request
  try {
    const response = await axios.post(WEBHOOK_URL, xmlPayload, { headers });
    console.log('Test notification sent successfully!');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Check the console of your running holoClip-schedule server for processing logs.');
  } catch (error) {
    console.error('Error sending test notification:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Data: ${error.response.data}`);
    } else {
      console.error(`  Message: ${error.message}`);
    }
    console.error('Please ensure your holoClip-schedule server is running and the WEBHOOK_URL is correct.');
  }
}

sendTestNotification();