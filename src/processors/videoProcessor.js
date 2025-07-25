const { getVideosByPlaylistId } = require('../api/youtubeClient');
const {
  getAllChannels,
  upsertVideos,
  getExistingVideoIds,
  upsertShorts,
  getExistingShortIds,
} = require('../database/dbManager');
const { HOLOLIVE_HASHTAGS } = require('../constants/hololiveMembers');

/**
 * 延遲指定的毫秒數。
 * @param {number} ms - 要延遲的毫秒數。
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 處理單個播放列表，抓取、篩選並儲存影片。
 * @param {string} playlistId - 要處理的播放列表 ID。
 * @param {object} channel - 該播放列表所屬的頻道物件。
 * @param {Function} getExistingIdsFunc - 用於檢查影片是否已存在的函式。
 * @param {Function} upsertFunc - 用於將影片寫入資料庫的函式。
 * @param {string} videoType - 影片類型（例如 "影片" 或 "Shorts"），用於日誌記錄。
 */
async function processPlaylist(playlistId, channel, getExistingIdsFunc, upsertFunc, videoType) {
  if (!playlistId) {
    console.log(`頻道 ${channel.channel_name} 沒有 ${videoType} 播放清單 ID，跳過。`);
    return;
  }
  console.log(`正在處理頻道 ${channel.channel_name} 的 ${videoType}...`);

  let nextPageToken = null;
  let allFilteredItems = [];
  let shouldStop = false;

  do {
    const page = await getVideosByPlaylistId(playlistId, nextPageToken);
    if (!page || !page.items || page.items.length === 0) {
      console.log(`無法獲取頻道 ${channel.channel_name} 的 ${videoType}，或已達列表末端。`);
      break;
    }

    const videoIds = page.items.map(v => v.snippet.resourceId.videoId);
    const existingIds = await getExistingIdsFunc(videoIds);

    const newItems = page.items.filter(v => !existingIds.has(v.snippet.resourceId.videoId));

    if (newItems.length < page.items.length) {
      shouldStop = true;
      console.log(`發現已存在的 ${videoType}，將在此頁處理完畢後停止抓取。`);
    }

    const filteredItems = newItems.filter(video => {
      const description = video.snippet.description?.toLowerCase() || '';
      return HOLOLIVE_HASHTAGS.some(hashtag => description.includes(hashtag.toLowerCase()));
    }).map(video => ({
      video_id: video.snippet.resourceId.videoId,
      channel_id: channel.channel_id,
      title: video.snippet.title,
      description: video.snippet.description,
      published_at: video.snippet.publishedAt,
      thumbnail_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
    }));

    if (filteredItems.length > 0) {
      allFilteredItems.push(...filteredItems);
    }

    nextPageToken = page.nextPageToken;
  } while (nextPageToken && !shouldStop);

  if (allFilteredItems.length > 0) {
    console.log(`頻道 ${channel.channel_name} 找到 ${allFilteredItems.length} 個新的符合條件的 ${videoType}，正在寫入資料庫...`);
    await upsertFunc(allFilteredItems);
  } else {
    console.log(`頻道 ${channel.channel_name} 沒有找到新的符合條件的 ${videoType}。`);
  }
}


/**
 * 抓取並篩選所有已存儲頻道的影片和 Shorts，並將符合條件的項目存入資料庫。
 */
async function fetchAndFilterVideos() {
  console.log('開始抓取與篩選影片和 Shorts...');
  const channels = await getAllChannels();
  if (!channels || channels.length === 0) {
    console.log('資料庫中沒有頻道，任務結束。');
    return;
  }

  const batchSize = 10; // 一次平行處理 10 個頻道以避免觸發 API 速率限制
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    console.log(`\n--- 開始處理批次 ${i / batchSize + 1}，包含 ${batch.length} 個頻道 ---`);

    const batchPromises = batch.map(channel => {
      return (async () => {
        console.log(`--- 開始處理頻道: ${channel.channel_name} (${channel.channel_id}) ---`);
        try {
          // 處理一般影片
          await processPlaylist(channel.videos_playlist_id, channel, getExistingVideoIds, upsertVideos, '一般影片');
          // 處理 Shorts
          await processPlaylist(channel.shorts_playlist_id, channel, getExistingShortIds, upsertShorts, 'Shorts');
          console.log(`--- 頻道 ${channel.channel_name} 處理完畢 ---`);
        } catch (error) {
          console.error(`處理頻道 ${channel.channel_name} (${channel.channel_id}) 時發生錯誤:`, error.message);
          // 即使單一頻道失敗，也不中斷整個批次
        }
      })();
    });

    await Promise.all(batchPromises);
    console.log(`--- 批次 ${i / batchSize + 1} 處理完畢，延遲 1 秒... ---`);
    await delay(1000); // 在批次之間加入延遲
  }

  console.log('\n所有頻道影片與 Shorts 抓取與篩選任務完成。');
}

module.exports = {
  fetchAndFilterVideos,
};