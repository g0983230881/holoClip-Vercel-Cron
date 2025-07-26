const db = require('./dbManager');

/**
 * 從資料庫中獲取所有已啟用並帶有 uploads_playlist_id 的頻道。
 * @returns {Promise<Array<Object>>} - 包含頻道資訊的陣列。
 */
async function getAllChannelsWithPlaylistId() {
  const { rows } = await db.query('SELECT channel_id, uploads_playlist_id FROM youtube_channels WHERE is_active = true AND uploads_playlist_id IS NOT NULL');
  return rows;
}

/**
 * 從資料庫中獲取所有缺少 uploads_playlist_id 的頻道。
 * @returns {Promise<Array<Object>>} - 包含頻道資訊的陣列。
 */
async function getChannelsWithoutPlaylistId() {
    const { rows } = await db.query('SELECT channel_id FROM youtube_channels WHERE uploads_playlist_id IS NULL');
    return rows;
}

/**
 * 根據頻道 ID 獲取單一頻道。
 * @param {string} channelId - 頻道 ID。
 * @returns {Promise<Object|null>} - 頻道物件，如果不存在則返回 null。
 */
async function getChannelById(channelId) {
  const { rows } = await db.query('SELECT * FROM youtube_channels WHERE channel_id = $1', [channelId]);
  return rows[0] || null;
}

/**
 * 插入或更新單一頻道資料。
 * @param {Object} channel - 要插入的頻道物件。
 */
async function upsertChannel(channel) {
  const query = `
    INSERT INTO youtube_channels (channel_id, channel_name, subscriber_count, video_count, thumbnail_url, videos_playlist_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (channel_id) DO UPDATE SET
      channel_name = EXCLUDED.channel_name,
      subscriber_count = EXCLUDED.subscriber_count,
      video_count = EXCLUDED.video_count,
      thumbnail_url = EXCLUDED.thumbnail_url,
      videos_playlist_id = EXCLUDED.videos_playlist_id,
      last_updated = NOW();
  `;
  const values = [
    channel.id,
    channel.snippet.title,
    channel.statistics.subscriberCount,
    channel.statistics.videoCount,
    channel.snippet.thumbnails.default.url,
    channel.contentDetails.relatedPlaylists.uploads,
  ];
  await db.query(query, values);
}

module.exports = {
  getAllChannelsWithPlaylistId,
  getChannelsWithoutPlaylistId,
  getChannelById,
  upsertChannel,
};