const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const HttpError = require('../../models/http-error'); // Assuming you have this model for handling errors

const initializeAWS = async () => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;

    try {
        const s3 = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        if (!s3) {
            throw new HttpError('AWS S3 client could not be initialized.', 409);
        }

        console.log('AWS Connection established.');

        const { Buckets } = await s3.send(new ListBucketsCommand({}));
        console.log('Buckets:', Buckets);
    } catch (err) {
        console.error('Error:', err); // Print the full error to understand what went wrong
        throw new HttpError('Connection not established. Error: ' + err.message, 500);
    }
};

module.exports = {
    initializeAWS
};
