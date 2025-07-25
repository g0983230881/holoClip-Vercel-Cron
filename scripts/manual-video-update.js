const videoUpdater = require('../src/processors/videoUpdater');

(async () => {
  console.log('手動影片更新腳本啟動...');
  try {
    await videoUpdater.updateAllChannels();
    console.log('手動影片更新腳本執行成功。');
    process.exit(0); // 成功時正常退出
  } catch (error) {
    console.error('手動更新腳本執行時發生錯誤:', error);
    process.exit(1); // 發生錯誤時退出
  }
})();