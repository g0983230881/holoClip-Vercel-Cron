/**
 * 從 search.list API 回應中提取頻道 ID。
 * @param {object} searchResponse search.list API 的回應資料。
 * @returns {string[]} 頻道 ID 陣列。
 */
function extractChannelIds(searchResponse) {
  if (!searchResponse || !searchResponse.items) {
    return [];
  }
  return searchResponse.items
    .filter(item => item.id && item.id.channelId)
    .map(item => item.id.channelId);
}

/**
 * 從 channels.list API 回應中提取和整理頻道詳細資訊。
 * @param {object} channelsResponse channels.list API 的回應資料。
 * @returns {Array<object>} 整理後的頻道資料物件陣列。
 */
function processChannelDetails(channelsResponse) {
  if (!channelsResponse || !channelsResponse.items) {
    return [];
  }

  return channelsResponse.items.map(item => {
    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const thumbnails = snippet.thumbnails || {};

    return {
      channel_id: item.id,
      channel_name: snippet.title || 'Unknown Channel',
      subscriber_count: parseInt(statistics.subscriberCount || 0),
      video_count: parseInt(statistics.videoCount || 0),
      thumbnail_url: thumbnails.high ? thumbnails.high.url : (thumbnails.medium ? thumbnails.medium.url : (thumbnails.default ? thumbnails.default.url : null)),
    };
  });
}

/**
 * 對頻道資料進行去重。
 * @param {Array<string>} channelIds 頻道 ID 陣列。
 * @returns {string[]} 去重後的頻道 ID 陣列。
 */
function deduplicateChannelIds(channelIds) {
  return Array.from(new Set(channelIds));
}

/**
 * 根據頻道名稱和描述進行初步過濾，判斷是否為潛在的翻譯精華頻道。
 * 這是一個簡單的範例，可以根據需要擴展。
 * @param {object} channelData 頻道資料物件。
 * @returns {boolean} 如果符合條件則為 true，否則為 false。
 */
function filterChannel(channelData) {
  const name = channelData.channel_name.toLowerCase();
  // const description = channelData.description ? channelData.description.toLowerCase() : ''; // search.list snippet doesn't include full description

  // 簡單的名稱過濾，可以根據實際情況調整
  const keywords = ['hololive', 'ホロライブ', '精華', '翻譯', '烤肉', '剪輯', '中文'];
  return keywords.some(keyword => name.includes(keyword));
}


module.exports = {
  extractChannelIds,
  processChannelDetails,
  deduplicateChannelIds,
  filterChannel,
};