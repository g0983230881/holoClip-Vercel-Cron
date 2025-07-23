const dbManager = require('./src/database/dbManager');
const channelProcessor = require('./src/processors/channelProcessor');

async function runCleanup() {
  console.log('Starting HoloClip Channel Cleaner...');

  try {
    // 1. 確保資料表存在
    await dbManager.createTable();

    // 2. 清理不活躍的頻道
    console.log('Starting inactive channel cleanup...');
    await channelProcessor.cleanupInactiveChannels();
    console.log('Inactive channel cleanup complete.');

  } catch (error) {
    console.error('An error occurred during cleanup:', error.message);
    console.error(error);
  } finally {
    // 確保資料庫連接池關閉
    await dbManager.pool.end();
    console.log('Database pool closed.');
  }
}

runCleanup();
