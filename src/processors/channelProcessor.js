const { getLatestVideoPublishDate } = require('../api/youtubeClient');
const { getAllChannels, deleteChannelsByIds, deleteChannelById } = require('../database/dbManager');

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
    const channelId = item.id;
    const channelIdSuffix = channelId.substring(2);

    return {
      channel_id: channelId,
      channel_name: snippet.title || 'Unknown Channel',
      subscriber_count: parseInt(statistics.subscriberCount || 0),
      video_count: parseInt(statistics.videoCount || 0),
      thumbnail_url: thumbnails.high ? thumbnails.high.url : (thumbnails.medium ? thumbnails.medium.url : (thumbnails.default ? thumbnails.default.url : null)),
      videos_playlist_id: `UULF${channelIdSuffix}`,
      shorts_playlist_id: `UUSH${channelIdSuffix}`,
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

/**
 * 清理超過一年沒有發布新影片的不活躍頻道。
 */
async function cleanupInactiveChannels() {
  console.log('Starting cleanup of inactive channels...');

  try {
    const allChannels = await getAllChannels();
    console.log(`Found ${allChannels.length} channels in the database.`);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const checkPromises = allChannels.map(async (channel) => {
      // 為了避免對 YouTube API 造成太大負擔，在請求之間加入短暫的延遲
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const latestVideoDate = await getLatestVideoPublishDate(channel.channel_id);
      
      if (latestVideoDate === null) {
        console.log(`Channel ${channel.channel_name} has no videos. Marked for deletion.`);
        return channel.channel_id;
      }
      
      if (latestVideoDate < oneYearAgo) {
        console.log(`Channel ${channel.channel_name} (${channel.channel_id}) is inactive since ${latestVideoDate.toISOString()}. Marked for deletion.`);
        return channel.channel_id;
      }
      
      return null;
    });

    const results = await Promise.all(checkPromises);
    const channelsToDelete = results.filter(id => id !== null);

    if (channelsToDelete.length > 0) {
      console.log(`Found ${channelsToDelete.length} inactive channels to delete.`);
      const deletedCount = await deleteChannelsByIds(channelsToDelete);
      console.log(`Successfully deleted ${deletedCount} channels from the database.`);
    } else {
      console.log('No inactive channels found to delete.');
    }

    console.log('Cleanup of inactive channels finished.');
  } catch (error) {
    console.error('An error occurred during the cleanup process:', error);
  }
}


module.exports = {
  extractChannelIds,
  processChannelDetails,
  deduplicateChannelIds,
  filterChannel,
  cleanupInactiveChannels,
};