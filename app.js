const dbManager = require('./src/database/dbManager');
const channelProcessor = require('./src/processors/channelProcessor');
const videoProcessor = require('./src/processors/videoProcessor');

async function runFetchAndFilter() {
  console.log('Starting to fetch and filter videos...');

  try {
    // 1. 確保資料表存在
    await dbManager.createTable();
    await dbManager.createVideosTable();

    // 2. 抓取與篩選影片
    console.log('Starting video fetching and filtering...');
    // await channelProcessor.cleanupInactiveChannels();
    await videoProcessor.fetchAndFilterVideos();
    console.log('Video fetching and filtering complete.');

  } catch (error) {
    console.error('An error occurred during fetching and filtering:', error.message);
    console.error(error);
  } finally {
    // 確保資料庫連接池關閉
    await dbManager.pool.end();
    console.log('Database pool closed.');
  }
}

runFetchAndFilter();
