const { fetchAndFilterVideos } = require('./videoProcessor');

/**
 * 更新所有頻道的影片列表。
 * 這是一個包裝函式，主要為了保持與 cron job 的相容性。
 */
async function updateAllChannels() {
  console.log('Starting all channels update via videoProcessor...');
  try {
    await fetchAndFilterVideos();
    console.log('All channels update finished via videoProcessor.');
  } catch (error) {
    console.error('An error occurred during the updateAllChannels process:', error);
    // 根據需要，可以決定是否要重新拋出錯誤
    throw error;
  }
}

module.exports = {
  updateAllChannels,
};