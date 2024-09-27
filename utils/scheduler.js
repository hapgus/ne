const cron = require('node-cron');
const { fetchData } = require('../utils/analytics/google-analytics-g4');
const { writeCache } = require('../utils/cache');

// Function to initiate scheduled tasks
function startScheduledTasks() {
    // cron.schedule('*/30 * * * *', async () => {
    // cron.schedule('*/30 * * * *', async () => {
        cron.schedule('*/1 * * * *', async () => {
        try {
            console.log('Fetching data for caching...');
            
            const data = await fetchData();  // Fetching the data

            // console.log('Fetched data:', JSON.stringify(data)); 

            if (data) { 
                writeCache(data);
                console.log('Cache refreshed.');
            } else {
                console.log('No data fetched. Cache not updated.');
            }

        } catch(error) {
            console.error('Error during scheduler execution:', error);
        }
    });
}

module.exports = {
    startScheduledTasks
};