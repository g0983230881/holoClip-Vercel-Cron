const db = require('./dbManager');

/**
 * 檢查指定的 video ID 是否已存在於資料庫中。
 * @param {Array<string>} videoIds - 要檢查的 YouTube video ID 陣列。
 * @returns {Promise<Set<string>>} - 一個包含已存在 video ID 的 Set。
 */
async function getExistingVideoIds(videoIds) {
  if (videoIds.length === 0) {
    return new Set();
  }
  const { rows } = await db.query('SELECT youtube_video_id FROM youtube_videos WHERE youtube_video_id = ANY($1::text[])', [videoIds]);
  return new Set(rows.map(row => row.youtube_video_id));
}

/**
 * 將一批新的影片資料插入到資料庫中。
 * @param {Array<Object>} videos - 要插入的影片物件陣列。
 *   每個物件應包含：youtube_video_id, youtube_channel_id, title, published_at
 */
async function batchInsertVideos(videos) {
  if (videos.length === 0) {
    return;
  }

  const values = videos.map(v => `('${v.youtube_video_id}', '${v.channel_id}', '${v.title.replace(/'/g, "''")}', '${v.published_at}')`).join(',');
  const query = `INSERT INTO youtube_videos (youtube_video_id, channel_id, title, published_at) VALUES ${values}`;
  
  await db.query(query);
}

module.exports = {
  getExistingVideoIds,
  batchInsertVideos,
};