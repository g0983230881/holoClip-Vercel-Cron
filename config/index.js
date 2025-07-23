require('dotenv').config();

const config = {
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    quotaPerSearch: 100, // search.list costs 100 units
    quotaPerChannelDetails: 1, // channels.list costs 1 unit
    dailyQuotaLimit: 10000,
    maxResultsPerRequest: 50 // Max results for search.list and channels.list
  },
  database: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: true,
  },
  keywords: [
    'Hololive 翻譯', 'Hololive 烤肉', 'Hololive 剪輯',
    'ホロライブ 翻譯', 'ホロライブ 烤肉', 'ホロライブ 剪輯'
  ],
  search: {
    maxSearchPages: 2 // Limit the number of pages to search per keyword to control quota
  }
};

// Validate essential configurations
if (!config.youtube.apiKey) {
  console.error('Error: YOUTUBE_API_KEY is not set in .env file.');
  process.exit(1);
}

if (!config.database.user || !config.database.host || !config.database.database || !config.database.password) {
  console.error('Error: Database connection details (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD) are not fully set in .env file.');
  process.exit(1);
}

module.exports = config;