const { Pool } = require('pg');
const config = require('../../config');
const format = require('pg-format');

const pool = new Pool(config.database);

/**
 * 執行 SQL 查詢的通用函式。
 * @param {string} text - 要執行的 SQL 查詢語句。
 * @param {Array} params - 查詢的參數。
 * @returns {Promise<object>} - 查詢結果。
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text });
    throw error;
  }
}

/**
 * 建立 youtube_channels 資料表 (如果不存在)。
 */
async function createTable() {
  const queryText = `
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
  try {
    await query(queryText);
    console.log('Table youtube_channels ensured to exist.');
  } catch (error) {
    console.error('Error creating table:', error.message);
    throw error;
  }
}

/**
 * 批量插入或更新頻道資料 (UPSERT)。
 * @param {Array<object>} channelDataList 頻道資料物件陣列。
 */
async function upsertChannelData(channelDataList) {
  if (!channelDataList || channelDataList.length === 0) {
    return;
  }

  const values = channelDataList.map(c => [
    c.channel_id,
    c.channel_name,
    c.subscriber_count,
    c.video_count,
    c.thumbnail_url,
  ]);

  const queryText = format(
    `INSERT INTO youtube_channels (channel_id, channel_name, subscriber_count, video_count, thumbnail_url)
     VALUES %L
     ON CONFLICT (channel_id) DO UPDATE SET
       channel_name = EXCLUDED.channel_name,
       subscriber_count = EXCLUDED.subscriber_count,
       video_count = EXCLUDED.video_count,
       thumbnail_url = EXCLUDED.thumbnail_url,
       last_updated = NOW();`,
    values
  );

  try {
    await query(queryText);
    console.log(`Successfully upserted ${channelDataList.length} channel(s).`);
  } catch (error) {
    console.error('Error during upserting channel data:', error.message);
    throw error;
  }
}

/**
 * 從資料庫獲取所有頻道的列表。
 * @returns {Promise<Array<object>>} 包含所有頻道資料的陣列。
 */
async function getAllChannels() {
  const queryText = 'SELECT channel_id, channel_name FROM youtube_channels;';
  try {
    const res = await query(queryText);
    return res.rows;
  } catch (error) {
    console.error('Error getting all channels:', error.message);
    throw error;
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

  const queryText = 'DELETE FROM youtube_channels WHERE channel_id = ANY($1::text[]);';
  try {
    const res = await query(queryText, [channelIds]);
    console.log(`Successfully deleted ${res.rowCount} channel(s).`);
    return res.rowCount;
  } catch (error) {
    console.error('Error deleting channels by IDs:', error.message);
    throw error;
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
  return deleteChannelsByIds([channelId]);
}

/**
 * 建立 channel_videos 資料表 (如果不存在)。
 */
async function createVideosTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS channel_videos (
      video_id VARCHAR PRIMARY KEY,
      channel_id VARCHAR,
      title VARCHAR NOT NULL,
      description TEXT,
      published_at TIMESTAMP WITH TIME ZONE,
      thumbnail_url VARCHAR,
      FOREIGN KEY (channel_id) REFERENCES youtube_channels(channel_id) ON DELETE CASCADE
    );
  `;
  try {
    await query(queryText);
    console.log('Table channel_videos ensured to exist.');
  } catch (error) {
    console.error('Error creating channel_videos table:', error.message);
    throw error;
  }
}

/**
 * 批量插入或更新影片資料 (UPSERT)。
 * @param {Array<object>} videoDataList 影片資料物件陣列。
 */
async function upsertVideos(videoDataList) {
  if (!videoDataList || videoDataList.length === 0) {
    return;
  }

  const values = videoDataList.map(v => [
    v.video_id,
    v.channel_id,
    v.title,
    v.description,
    v.published_at,
    v.thumbnail_url,
  ]);

  const queryText = format(
    `INSERT INTO channel_videos (video_id, channel_id, title, description, published_at, thumbnail_url)
     VALUES %L
     ON CONFLICT (video_id) DO UPDATE SET
       channel_id = EXCLUDED.channel_id,
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       published_at = EXCLUDED.published_at,
       thumbnail_url = EXCLUDED.thumbnail_url;`,
    values
  );

  try {
    await query(queryText);
    console.log(`Successfully upserted ${videoDataList.length} video(s).`);
  } catch (error) {
    console.error('Error during upserting video data:', error.message);
    throw error;
  }
}

module.exports = {
  query,
  createTable,
  upsertChannelData,
  getAllChannels,
  deleteChannelsByIds,
  deleteChannelById,
  createVideosTable,
  upsertVideos,
};