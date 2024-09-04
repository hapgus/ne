const { S3Client } = require('@aws-sdk/client-s3');

// Initialize the S3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

//PUSH ANALYTICS
const uploadToS3 = async (file) => {
    const params = {
        Bucket: process.env.AWS_DATA_BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer
    };

    try {
        console.log(`Uploading ${file.originalname} to S3...`);
        const stored = await s3.upload(params).promise();
        console.log(`Successfully uploaded ${file.originalname} to S3.`);
        return stored.Location; // The URL of the uploaded file
    } catch (error) {
        console.error(`Error uploading ${file.originalname} to S3:`, error);
        throw error;
    }
};

//FETCH ANALYTICS
async function getFromS3(filename) {
    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: filename
    };

    try {
        const data = await s3.getObject(params).promise();
        return data.Body.toString('utf-8');
    } catch (error) {
        console.error(`Error fetching ${filename} from S3:`, error);
        throw error;
    }
}


module.exports = { uploadToS3, getFromS3 };