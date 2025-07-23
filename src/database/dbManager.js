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

/**
 * 從資料庫獲取所有頻道的列表。
 * @returns {Promise<Array<object>>} 包含所有頻道資料的陣列。
 */
async function getAllChannels() {
  const client = await pool.connect();
  try {
    const query = 'SELECT channel_id, channel_name FROM youtube_channels;';
    const res = await client.query(query);
    return res.rows;
  } catch (error) {
    console.error('Error getting all channels:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 根據提供的 ID 陣列從資料庫中刪除頻道。
 * @param {string[]} channelIds 要刪除的頻道 ID 陣列。
 * @returns {Promise<number>} 已刪除的行數。
 */
async function deleteChannelsByIds(channelIds) {
  if (!channelIds || channelIds.length === 0) {
    console.log('No channel IDs provided for deletion.');
    return 0;
  }

  const client = await pool.connect();
  try {
    const query = 'DELETE FROM youtube_channels WHERE channel_id = ANY($1::text[]);';
    const res = await client.query(query, [channelIds]);
    console.log(`Successfully deleted ${res.rowCount} channel(s).`);
    return res.rowCount;
  } catch (error) {
    console.error('Error deleting channels by IDs:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 根據提供的 ID 從資料庫中刪除單一頻道。
 * @param {string} channelId 要刪除的頻道 ID。
 * @returns {Promise<number>} 已刪除的行數 (0 或 1)。
 */
async function deleteChannelById(channelId) {
  if (!channelId) {
    console.log('No channel ID provided for deletion.');
    return 0;
  }
  // 重用 deleteChannelsByIds 函式來避免重複程式碼
  return deleteChannelsByIds([channelId]);
}

module.exports = {
  pool, // Export pool for potential direct use or closing
  createTable,
  upsertChannelData,
  getAllChannels,
  deleteChannelsByIds,
  deleteChannelById,
};