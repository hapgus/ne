

const { uploadToS3, getFromS3 } = require('../middleware/data-upload')

async function readCache() {
    try {
        // Logic to get dataCache.json from S3
        const serializedData = await getFromS3('dataCache.json'); // You'd need to implement this function
        if (serializedData) {
            return JSON.parse(serializedData);
        }
    } catch (error) {
        console.error('Error reading cache:', error);
    }
    console.log('No cache file found or an error occurred.');
    return null;
}


async function writeCache(data) {
    try {
        const serializedData = JSON.stringify(data);
        const cacheFile = {
            originalname: 'dataCache.json',
            buffer: Buffer.from(serializedData)
        };

        await uploadToS3(cacheFile);
        console.log('Data written to S3 cache.');
        
    } catch (error) {
        console.error('Error writing to cache:', error);
    }
}

module.exports = {
    readCache,
    writeCache
};
