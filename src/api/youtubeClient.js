const { google } = require('googleapis');
const config = require('../../config');

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtube.apiKey,
});

let currentQuotaUsage = 0;

/**
 * 呼叫 YouTube Data API search.list 方法來搜尋頻道。
 * @param {string} query 搜尋關鍵字。
 * @param {string|null} pageToken 用於分頁的 nextPageToken。
 * @returns {Promise<object>} API 回應資料。
 */
async function searchChannels(query, pageToken = null) {
  if (currentQuotaUsage + config.youtube.quotaPerSearch > config.youtube.dailyQuotaLimit) {
    console.warn('Daily quota limit approaching. Skipping search request.');
    return { items: [], nextPageToken: null };
  }

  try {
    const response = await youtube.search.list({
      q: query,
      type: 'channel',
      part: 'snippet',
      maxResults: config.youtube.maxResultsPerRequest,
      pageToken: pageToken,
      relevanceLanguage: 'zh-Hant', // 優先顯示繁體中文相關結果
      order: 'relevance'
    });
    currentQuotaUsage += config.youtube.quotaPerSearch;
    console.log(`Quota used for search: ${config.youtube.quotaPerSearch}. Total quota used: ${currentQuotaUsage}`);
    return response.data;
  } catch (error) {
    console.error(`Error searching channels for query "${query}":`, error.message);
    // Implement retry logic if needed, for now just re-throw or return empty
    throw error;
  }
}

/**
 * 呼叫 YouTube Data API channels.list 方法來獲取頻道詳細資訊。
 * @param {string[]} channelIds 頻道 ID 陣列 (最多 50 個)。
 * @returns {Promise<object>} API 回應資料。
 */
async function getChannelDetails(channelIds) {
  if (channelIds.length === 0) {
    return { items: [] };
  }

  if (currentQuotaUsage + config.youtube.quotaPerChannelDetails > config.youtube.dailyQuotaLimit) {
    console.warn('Daily quota limit approaching. Skipping channel details request.');
    return { items: [] };
  }

  try {
    const response = await youtube.channels.list({
      id: channelIds.join(','),
            part: 'snippet,statistics,contentDetails',
    });
    currentQuotaUsage += config.youtube.quotaPerChannelDetails;
    console.log(`Quota used for channel details: ${config.youtube.quotaPerChannelDetails}. Total quota used: ${currentQuotaUsage}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting channel details for IDs "${channelIds.join(',')}":`, error.message);
    throw error;
  }
}

/**
 * 獲取當前已使用的配額。
 * @returns {number} 當前已使用的配額。
 */
function getCurrentQuotaUsage() {
  return currentQuotaUsage;
}


/**
 * 根據播放清單 ID 獲取影片列表。
 * @param {string} playlistId 播放清單的 ID。
 * @param {string|null} pageToken 用於分頁的 nextPageToken。
 * @returns {Promise<object|null>} API 回應資料，包含影片列表和 nextPageToken，或在錯誤時回傳 null。
 */
async function getVideosByPlaylistId(playlistId, pageToken = null) {
  try {
    const response = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: playlistId,
      maxResults: 50,
      pageToken: pageToken,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching videos for playlist ${playlistId}:`, error.message);
    return null;
  }
}


/**
 * 根據影片 ID 獲取單一影片的詳細資訊。
 * @param {string} videoId - YouTube 影片 ID。
 * @returns {Promise<object|null>} - API 回應中的影片項目，如果找不到則返回 null。
 */
async function getVideoDetailsById(videoId) {
  try {
    const response = await youtube.videos.list({
      part: 'snippet,contentDetails', // contentDetails 可以用來判斷影片長度
      id: videoId,
    });
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching details for video ${videoId}:`, error.message);
    return null;
  }
}

module.exports = {
  searchChannels,
  getChannelDetails,
  getVideosByPlaylistId,
  getVideoDetailsById,
};