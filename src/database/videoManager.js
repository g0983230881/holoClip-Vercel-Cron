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

/**
 * 插入或更新單一影片資料到 youtube_videos 表。
 * @param {Object} video - 要插入的影片物件。
 */
async function upsertVideo(video) {
  const query = `
    INSERT INTO youtube_videos (video_id, channel_id, title, description, published_at, thumbnail_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (video_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      published_at = EXCLUDED.published_at,
      thumbnail_url = EXCLUDED.thumbnail_url;
  `;
  const values = [
    video.video_id,
    video.channel_id,
    video.title,
    video.description,
    video.published_at,
    video.thumbnail_url,
  ];

  await db.query(query, values);
  console.log(`Video ${video.video_id} has been inserted or updated in youtube_videos.`);
}

/**
 * 插入或更新單一 Short 資料到 youtube_shorts 表。
 * @param {Object} short - 要插入的 Short 物件。
 */
async function upsertShort(short) {
  const query = `
    INSERT INTO youtube_shorts (video_id, channel_id, title, description, published_at, thumbnail_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (video_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      published_at = EXCLUDED.published_at,
      thumbnail_url = EXCLUDED.thumbnail_url;
  `;
  const values = [
    short.video_id,
    short.channel_id,
    short.title,
    short.description,
    short.published_at,
    short.thumbnail_url,
  ];

  await db.query(query, values);
  console.log(`Short ${short.video_id} has been inserted or updated in youtube_shorts.`);
}

module.exports = {
  getExistingVideoIds,
  batchInsertVideos,
  upsertVideo,
  upsertShort,
};