require('dotenv').config({ path: './.env.local' });
const dbManager = require('../src/database/dbManager');

/**
 * 為 youtube_channels 表格回填 videos_playlist_id 和 shorts_playlist_id。
 * videos_playlist_id 的格式為 "UULF" + channel_id 的後 22 個字元。
 * shorts_playlist_id 的格式為 "UUSH" + channel_id 的後 22 個字元。
 */
async function backfillPlaylistIds() {
  console.log('Starting backfill process for videos_playlist_id and shorts_playlist_id...');

  const pool = dbManager.pool;

  try {
    const allChannels = await dbManager.getAllChannels();

    if (allChannels.length === 0) {
      console.log('No channels found in the database. No action needed.');
      return;
    }

    console.log(`Found ${allChannels.length} channels to process.`);

    const format = require('pg-format');

    const channelsToUpdate = allChannels
      .map(channel => {
        const { channel_id } = channel;
        if (channel_id && channel_id.length === 24 && channel_id.startsWith('UC')) {
          const idSuffix = channel_id.substring(2);
          const videos_playlist_id = `UULF${idSuffix}`;
          const shorts_playlist_id = `UUSH${idSuffix}`;
          return [channel_id, videos_playlist_id, shorts_playlist_id];
        } else {
          console.warn(`Skipping channel with invalid ID format: ${channel_id}`);
          return null;
        }
      })
      .filter(Boolean); // 移除格式不符的 null 項目

    if (channelsToUpdate.length === 0) {
      console.log('No valid channels to update.');
      return;
    }

    const queryText = format(
      `UPDATE youtube_channels AS c
       SET
         videos_playlist_id = v.videos_playlist_id,
         shorts_playlist_id = v.shorts_playlist_id
       FROM (VALUES %L) AS v(channel_id, videos_playlist_id, shorts_playlist_id)
       WHERE c.channel_id = v.channel_id;`,
      channelsToUpdate
    );

    await dbManager.query(queryText);

    console.log(`Successfully updated ${channelsToUpdate.length} channels with new playlist IDs in a single batch.`);

  } catch (error) {
    console.error('An error occurred during the backfill process:', error);
  } finally {
    await pool.end();
    console.log('Database connection pool closed.');
  }
}

backfillPlaylistIds();