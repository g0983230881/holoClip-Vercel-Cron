const config = require('./config');
const youtubeClient = require('./src/api/youtubeClient');
const dbManager = require('./src/database/dbManager');
const channelProcessor = require('./src/processors/channelProcessor');

async function runScraper() {
  console.log('Starting Hololive Channel Scraper...');

  try {
    // 1. 確保資料表存在
    await dbManager.createTable();

    const allFoundChannelIds = new Set();
    let currentQuota = youtubeClient.getCurrentQuotaUsage();

    // 2. 搜尋頻道 ID
    for (const keyword of config.keywords) {
      if (currentQuota >= config.youtube.dailyQuotaLimit) {
        console.warn('Daily quota limit reached. Stopping search phase.');
        break;
      }

      console.log(`Searching channels for keyword: "${keyword}"`);
      let pageToken = null;
      let pagesSearched = 0;

      while (pagesSearched < config.search.maxSearchPages) {
        if (currentQuota + config.youtube.quotaPerSearch > config.youtube.dailyQuotaLimit) {
          console.warn('Daily quota limit approaching. Stopping current keyword search.');
          break;
        }

        const searchData = await youtubeClient.searchChannels(keyword, pageToken);
        const extractedIds = channelProcessor.extractChannelIds(searchData);
        extractedIds.forEach(id => allFoundChannelIds.add(id));

        pageToken = searchData.nextPageToken;
        pagesSearched++;
        currentQuota = youtubeClient.getCurrentQuotaUsage();

        if (!pageToken) {
          console.log(`No more pages for keyword "${keyword}".`);
          break;
        }
        // Add a small delay to avoid hitting rate limits too quickly
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Total unique channel IDs found: ${allFoundChannelIds.size}`);

    // 3. 獲取頻道詳細資訊並儲存
    const uniqueChannelIdsArray = Array.from(allFoundChannelIds);
    const BATCH_SIZE = config.youtube.maxResultsPerRequest; // 50
    let processedChannelsCount = 0;

    for (let i = 0; i < uniqueChannelIdsArray.length; i += BATCH_SIZE) {
      if (currentQuota >= config.youtube.dailyQuotaLimit) {
        console.warn('Daily quota limit reached. Stopping channel details retrieval phase.');
        break;
      }

      const batchIds = uniqueChannelIdsArray.slice(i, i + BATCH_SIZE);
      console.log(`Fetching details for batch of ${batchIds.length} channels...`);

      const detailsData = await youtubeClient.getChannelDetails(batchIds);
      const processedChannels = channelProcessor.processChannelDetails(detailsData);

      // 可以在這裡加入更嚴格的過濾，例如檢查頻道描述
      const filteredChannels = processedChannels.filter(channelProcessor.filterChannel);

      if (filteredChannels.length > 0) {
        await dbManager.upsertChannelData(filteredChannels);
        processedChannelsCount += filteredChannels.length;
      }
      currentQuota = youtubeClient.getCurrentQuotaUsage();

      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Scraping complete. Successfully processed and stored ${processedChannelsCount} channels.`);
    console.log(`Final quota usage: ${currentQuota}`);

  } catch (error) {
    console.error('An error occurred during scraping:', error.message);
    console.error(error);
  } finally {
    // 確保資料庫連接池關閉
    await dbManager.pool.end();
    console.log('Database pool closed.');
  }
}

runScraper();