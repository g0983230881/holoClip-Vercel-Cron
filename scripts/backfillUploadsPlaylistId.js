require('dotenv').config({ path: './.env.local' });
const channelManager = require('../src/database/channelManager');
const youtubeClient = require('../src/api/youtubeClient');

async function backfill() {
  console.log('Starting backfill process for uploads_playlist_id...');

  const channelsToUpdate = await channelManager.getChannelsWithoutPlaylistId();

  if (channelsToUpdate.length === 0) {
    console.log('All channels already have an uploads_playlist_id. No action needed.');
    return;
  }

  console.log(`Found ${channelsToUpdate.length} channels to backfill.`);

  const allChannelIds = channelsToUpdate.map(c => c.channel_id);
  const batchSize = 50; // YouTube API limit
  const batches = [];

  for (let i = 0; i < allChannelIds.length; i += batchSize) {
    batches.push(allChannelIds.slice(i, i + batchSize));
  }

  console.log('\n--- Generated SQL UPDATE Statements ---');

  const processBatch = async (batchIds, index) => {
    console.log(`-- Processing batch ${index + 1}...`);
    try {
      const channelDetails = await youtubeClient.getChannelDetails(batchIds);
      if (!channelDetails || channelDetails.items.length === 0) {
        console.error(`-- Could not fetch channel details for batch starting with ${batchIds[0]}`);
        return;
      }
      
      channelDetails.items.forEach(item => {
        const channelId = item.id;
        const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;

        if (uploadsPlaylistId) {
          const sql = `UPDATE youtube_channels SET uploads_playlist_id = '${uploadsPlaylistId}' WHERE channel_id = '${channelId}';`;
          console.log(sql);
        } else {
          console.log(`-- Could not find uploads_playlist_id for channel: ${channelId}`);
        }
      });
    } catch (error) {
      console.error(`-- Error processing batch ${index + 1}:`, error.message);
    }
  };

  try {
    // 平行處理所有批次
    await Promise.all(batches.map(processBatch));

    console.log('\n--- End of SQL Statements ---\n');
    console.log('Copy and execute the above SQL statements in your database to complete the backfill.');

  } catch (error) {
    console.error('An error occurred during the backfill process:', error);
  }
}

backfill();