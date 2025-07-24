const videoUpdater = require('../../processors/videoUpdater');

module.exports = async (req, res) => {
  // Vercel Cron Job 保護
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await videoUpdater.updateAllChannels();
    res.status(200).json({ message: 'Video update process started successfully.' });
  } catch (error) {
    console.error('Cron job failed:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};