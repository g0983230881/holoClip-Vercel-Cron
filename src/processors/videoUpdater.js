const channelManager = require('../database/channelManager');
const videoManager = require('../database/videoManager');
const youtubeClient = require('../api/youtubeClient');

/**
 * 更新單一頻道的影片列表。
 * @param {object} channel - 包含頻道資訊的物件。
 *   應包含：youtube_channel_id, uploads_playlist_id
 */
async function updateSingleChannel(channel) {
  console.log(`Updating channel: ${channel.channel_id}`);
  const videoData = await youtubeClient.getVideosByPlaylistId(channel.uploads_playlist_id);
  
  if (!videoData || videoData.items.length === 0) {
    console.log(`No new videos found for channel: ${channel.channel_id}`);
    return;
  }

  const recentVideos = videoData.items;
  const videoIds = recentVideos.map(v => v.snippet.resourceId.videoId);
  const existingVideoIds = await videoManager.getExistingVideoIds(videoIds);

  const newVideos = recentVideos
    .filter(v => !existingVideoIds.has(v.snippet.resourceId.videoId))
    .map(v => ({
      youtube_video_id: v.snippet.resourceId.videoId,
      youtube_channel_id: channel.channel_id,
      title: v.snippet.title,
      published_at: v.snippet.publishedAt,
    }));

  if (newVideos.length > 0) {
    await videoManager.batchInsertVideos(newVideos);
    console.log(`Inserted ${newVideos.length} new videos for channel: ${channel.channel_id}`);
  } else {
    console.log(`No new videos to insert for channel: ${channel.channel_id}`);
  }
}

/**
 * 更新所有頻道的影片列表。
 */
async function updateAllChannels() {
  console.log('Starting all channels update...');
  const channels = await channelManager.getAllChannelsWithPlaylistId();

  // 將循序執行的 for 迴圈改為 Promise.all 平行處理
  const updatePromises = channels.map(channel =>
    updateSingleChannel(channel).catch(error => {
      // 捕捉單一頻道的錯誤，避免中斷整個 Promise.all
      console.error(`Failed to update channel ${channel.channel_id}:`, error);
    })
  );

  await Promise.all(updatePromises);

  console.log('All channels update finished.');
}

module.exports = {
  updateAllChannels,
  updateSingleChannel,
};