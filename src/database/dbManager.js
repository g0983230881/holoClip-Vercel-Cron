const { Pool } = require('pg');
const config = require('../../config');

const pool = new Pool(config.database);

/**
 * 建立 youtube_channels 資料表 (如果不存在)。
 */
async function createTable() {
  const client = await pool.connect();
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS youtube_channels (
        channel_id VARCHAR PRIMARY KEY,
        channel_name VARCHAR NOT NULL,
        subscriber_count BIGINT,
        video_count BIGINT,
        thumbnail_url VARCHAR,
        is_verified BOOLEAN DEFAULT FALSE,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await client.query(query);
    console.log('Table youtube_channels ensured to exist.');
  } catch (error) {
    console.error('Error creating table:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 批量插入或更新頻道資料 (UPSERT)。
 * @param {Array<object>} channelDataList 頻道資料物件陣列。
 */
async function upsertChannelData(channelDataList) {
  if (channelDataList.length === 0) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // 開始事務

    for (const data of channelDataList) {
      const query = `
        INSERT INTO youtube_channels (channel_id, channel_name, subscriber_count, video_count, thumbnail_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (channel_id) DO UPDATE SET
          channel_name = EXCLUDED.channel_name,
          subscriber_count = EXCLUDED.subscriber_count,
          video_count = EXCLUDED.video_count,
          thumbnail_url = EXCLUDED.thumbnail_url,
          last_updated = NOW();
      `;
      const values = [
        data.channel_id,
        data.channel_name,
        data.subscriber_count,
        data.video_count,
        data.thumbnail_url,
      ];
      await client.query(query, values);
    }

    await client.query('COMMIT'); // 提交事務
    console.log(`Successfully upserted ${channelDataList.length} channel(s).`);
  } catch (error) {
    await client.query('ROLLBACK'); // 回滾事務
    console.error('Error during upserting channel data:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool, // Export pool for potential direct use or closing
  createTable,
  upsertChannelData,
};