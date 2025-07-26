require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const { getAllChannels } = require('../database/dbManager');
const { pool } = require('../database/dbManager');

const HUB_URL = 'https://pubsubhubbub.appspot.com/';

/**
 * Sends a subscription or unsubscription request to the PubSubHubbub hub.
 * @param {string} channelId The YouTube channel ID.
 * @param {string} callbackUrl The public URL of your webhook.
 * @param {string} mode 'subscribe' or 'unsubscribe'.
 * @returns {Promise<void>}
 */
async function sendSubscriptionRequest(channelId, callbackUrl, mode) {
  const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
  const params = new URLSearchParams();
  params.append('hub.mode', mode);
  params.append('hub.topic', topicUrl);
  params.append('hub.callback', callbackUrl);
  // hub.lease_seconds can be added here if you want to request a specific lease duration.
  // Google's default is around 5 days. We can add a renewal script later if needed.

  try {
    const response = await axios.post(HUB_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`Successfully sent ${mode} request for channel ${channelId}. Status: ${response.status}`);
    } else {
      console.error(`Failed to send ${mode} request for ${channelId}. Status: ${response.status}`);
      console.error('Response:', response.data);
    }
  } catch (error) {
    console.error(`Error sending ${mode} request for channel ${channelId}:`, error.response ? error.response.data : error.message);
  }
}

/**
 * Main function to subscribe to all channels in the database.
 */
async function subscribeToAllChannels() {
  const callbackUrl = process.argv[2];
  if (!callbackUrl) {
    console.error('Error: Please provide your public webhook URL as an argument.');
    console.error('Usage: node scripts/subscribe.js https://your-vercel-app.vercel.app/api/webhook');
    return;
  }

  console.log(`Using webhook URL: ${callbackUrl}`);
  console.log('Fetching all channels from the database...');

  try {
    const channels = await getAllChannels();
    if (!channels || channels.length === 0) {
      console.log('No channels found in the database to subscribe to.');
      return;
    }

    console.log(`Found ${channels.length} channels. Sending subscription requests...`);

    for (const channel of channels) {
      await sendSubscriptionRequest(channel.channel_id, callbackUrl, 'subscribe');
      // Add a small delay to avoid rate limiting, although it's usually not an issue for subscriptions.
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\nAll subscription requests have been sent.');
    console.log('Check your Vercel server logs for incoming GET verification requests from Google.');
  } catch (error) {
    console.error('An error occurred during the subscription process:', error);
  } finally {
    // Close the database connection pool.
    await pool.end();
    console.log('Database pool closed.');
  }
}

subscribeToAllChannels();