const { google } = require('googleapis');
const config = require('../../config');

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtube.apiKey,
});

let currentQuotaUsage = 0;

// /**
//  * 呼叫 YouTube Data API search.list 方法來搜尋頻道。
//  * @param {string} query 搜尋關鍵字。
//  * @param {string|null} pageToken 用於分頁的 nextPageToken。
//  * @returns {Promise<object>} API 回應資料。
//  */
// async function searchChannels(query, pageToken = null) {
//   if (currentQuotaUsage + config.youtube.quotaPerSearch > config.youtube.dailyQuotaLimit) {
//     console.warn('Daily quota limit approaching. Skipping search request.');
//     return { items: [], nextPageToken: null };
//   }
//
//   try {
//     const response = await youtube.search.list({
//       q: query,
//       type: 'channel',
//       part: 'snippet',
//       maxResults: config.youtube.maxResultsPerRequest,
//       pageToken: pageToken,
//       relevanceLanguage: 'zh-Hant', // 優先顯示繁體中文相關結果
//       order: 'relevance'
//     });
//     currentQuotaUsage += config.youtube.quotaPerSearch;
//     console.log(`Quota used for search: ${config.youtube.quotaPerSearch}. Total quota used: ${currentQuotaUsage}`);
//     return response.data;
//   } catch (error) {
//     console.error(`Error searching channels for query "${query}":`, error.message);
//     // Implement retry logic if needed, for now just re-throw or return empty
//     throw error;
//   }
// }
//
// /**
//  * 呼叫 YouTube Data API channels.list 方法來獲取頻道詳細資訊。
//  * @param {string[]} channelIds 頻道 ID 陣列 (最多 50 個)。
//  * @returns {Promise<object>} API 回應資料。
//  */
// async function getChannelDetails(channelIds) {
//   if (channelIds.length === 0) {
//     return { items: [] };
//   }
//
//   if (currentQuotaUsage + config.youtube.quotaPerChannelDetails > config.youtube.dailyQuotaLimit) {
//     console.warn('Daily quota limit approaching. Skipping channel details request.');
//     return { items: [] };
//   }
//
//   try {
//     const response = await youtube.channels.list({
//       id: channelIds.join(','),
//       part: 'snippet,statistics',
//     });
//     currentQuotaUsage += config.youtube.quotaPerChannelDetails;
//     console.log(`Quota used for channel details: ${config.youtube.quotaPerChannelDetails}. Total quota used: ${currentQuotaUsage}`);
//     return response.data;
//   } catch (error) {
//     console.error(`Error getting channel details for IDs "${channelIds.join(',')}":`, error.message);
//     throw error;
//   }
// }
//
// /**
//  * 獲取當前已使用的配額。
//  * @returns {number} 當前已使用的配額。
//  */
// function getCurrentQuotaUsage() {
//   return currentQuotaUsage;
// }

/**
 * 獲取指定 YouTube 頻道最新一支影片的發布日期。
 * @param {string} channelId 頻道的 ID。
 * @returns {Promise<Date|null>} 最新影片的發布日期，如果找不到或發生錯誤則回傳 null。
 */
async function getLatestVideoPublishDate(channelId) {
  try {
    // 步驟 1: 獲取頻道的上傳播放清單 ID
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails',
      id: channelId,
    });

    const uploadsPlaylistId = channelResponse.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      console.error(`Could not find uploads playlist for channel ${channelId}`);
      return null;
    }

    // 步驟 2: 從上傳播放清單中獲取最新的影片
    const playlistResponse = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: 1,
    });

    const latestVideo = playlistResponse.data.items[0];

    if (!latestVideo) {
      console.log(`Channel ${channelId} has no videos.`);
      return null;
    }

    // 步驟 3: 解析並回傳發布日期
    const publishDate = new Date(latestVideo.snippet.publishedAt);
    return publishDate;

  } catch (error) {
    console.error(`Error fetching latest video date for channel ${channelId}:`, error.message);
    return null;
  }
}


module.exports = {
  // searchChannels,
  // getChannelDetails,
  // getCurrentQuotaUsage,
  getLatestVideoPublishDate,
};