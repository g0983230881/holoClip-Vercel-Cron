const { getChannelDetails, getVideosByPlaylistId } = require('../api/youtubeClient');
const { getAllChannels, upsertVideos } = require('../database/dbManager');
const { HOLOLIVE_HASHTAGS } = require('../constants/hololiveMembers');

/**
 * 延遲指定的毫秒數。
 * @param {number} ms - 要延遲的毫秒數。
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 抓取並篩選所有已存儲頻道的影片，並將符合條件的影片存入資料庫。
 */
async function fetchAndFilterVideos() {
  console.log('開始抓取與篩選影片...');
  const channels = await getAllChannels();
  if (!channels || channels.length === 0) {
    console.log('資料庫中沒有頻道，任務結束。');
    return;
  }

  for (const channel of channels) {
    console.log(`正在處理頻道: ${channel.channel_name} (${channel.channel_id})`);
    try {
      // 1. 獲取頻道的上傳播放清單 ID
      const channelDetails = await getChannelDetails([channel.channel_id]);
      const uploadsPlaylistId = channelDetails.items[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        console.warn(`找不到頻道 ${channel.channel_name} 的上傳播放清單，跳過此頻道。`);
        continue;
      }

      let nextPageToken = null;
      let allFilteredVideos = [];

      // 2. 分頁獲取並篩選影片
      do {
        const videoPage = await getVideosByPlaylistId(uploadsPlaylistId, nextPageToken);
        if (!videoPage || !videoPage.items) {
          console.log(`無法獲取頻道 ${channel.channel_name} 的影片，可能已處理完畢或發生錯誤。`);
          break;
        }

        const filteredVideos = videoPage.items.filter(video => {
          const description = video.snippet.description?.toLowerCase() || '';
          
          // 主要篩選條件：描述中是否包含至少一個 Hololive 相關的 Hashtag
          const hasHololiveHashtag = HOLOLIVE_HASHTAGS.some(hashtag => description.includes(hashtag.toLowerCase()));

          // 次要篩選條件 (預先實作但保持註解)
          // const titleKeywords = ['中文', '精華', '剪輯'];
          // const hasTitleKeyword = titleKeywords.some(keyword => video.snippet.title.toLowerCase().includes(keyword));

          return hasHololiveHashtag;
        }).map(video => ({
          video_id: video.snippet.resourceId.videoId,
          channel_id: channel.channel_id,
          title: video.snippet.title,
          description: video.snippet.description,
          published_at: video.snippet.publishedAt,
          thumbnail_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        }));

        if (filteredVideos.length > 0) {
          allFilteredVideos.push(...filteredVideos);
        }

        nextPageToken = videoPage.nextPageToken;
      } while (nextPageToken);

      // 3. 將篩選後的影片批量寫入資料庫
      if (allFilteredVideos.length > 0) {
        console.log(`頻道 ${channel.channel_name} 找到 ${allFilteredVideos.length} 支符合條件的影片，正在寫入資料庫...`);
        await upsertVideos(allFilteredVideos);
      } else {
        console.log(`頻道 ${channel.channel_name} 沒有找到新的符合條件的影片。`);
      }

      // 4. 加入延遲，避免請求過於頻繁
      console.log(`頻道 ${channel.channel_name} 處理完畢，延遲 1 秒...`);
      await delay(1000);

    } catch (error) {
      console.error(`處理頻道 ${channel.channel_name} (${channel.channel_id}) 時發生錯誤:`, error.message);
      // 即使單一頻道失敗，也繼續處理下一個
      continue;
    }
  }

  console.log('所有頻道影片抓取與篩選任務完成。');
}

module.exports = {
  fetchAndFilterVideos,
};