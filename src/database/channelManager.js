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

module.exports = {
  getAllChannelsWithPlaylistId,
  getChannelsWithoutPlaylistId,
};