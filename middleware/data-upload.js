const { S3Client, PutObjectCommand, GetObjectCommand  } = require('@aws-sdk/client-s3');

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
        const command = new PutObjectCommand(params);
        const result = await s3.send(command);  // Send the command to S3
        console.log(`Successfully uploaded ${file.originalname} to S3.`);
        return `https://${params.Bucket}.s3.amazonaws.com/${file.originalname}`;  // Return the URL of the uploaded file
    } catch (error) {
        console.error(`Error uploading ${file.originalname} to S3:`, error);
        throw error;
    }
};

//FETCH ANALYTICS
async function getFromS3(filename) {
    const params = {
        Bucket: process.env.AWS_DATA_BUCKET_NAME, // Ensure this is the correct bucket name
        Key: filename  // The file you're trying to get
    };

    try {
        const command = new GetObjectCommand(params);
        const data = await s3.send(command); // Get the object
        const stream = data.Body;
        const chunks = [];

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks).toString('utf-8'); // Convert buffer to string
    } catch (error) {
        console.error(`Error fetching ${filename} from S3:`, error);
        throw error;
    }
}


module.exports = { uploadToS3, getFromS3 };