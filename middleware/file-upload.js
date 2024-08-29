const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// Initialize the S3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});



// Set up Multer with S3 storage

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type
        key: function (_, file, cb) {
            console.log('MULTER FILE', file);

            // Determine the folder based on the fieldname
            let folder = 'media/images/';
            if (file.fieldname === 'qrcode' || file.fieldname.includes('resourceQrCodeImage')) {
                folder = 'media/qrcodes/';
            }

            // Extract the original file name without any folder path
            const originalFileName = path.basename(file.originalname);

            // Construct the full S3 object key (folder + file name)
            cb(null, `${folder}${originalFileName}`);
        }
    })
});

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.AWS_SECRET_ACCESS_KEY,
//         metadata: function (req, file, cb) {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: function (_, file, cb) {
//             console.log('MULTER FILE', file)
//             let folder = 'media/images/';
//             if (file.fieldname === 'qrcode' || file.fieldname.includes('resourceQrCodeImage')) {
//                 folder = 'media/qrcodes/';
//             }
//             cb(null, folder + file.originalname)
//         }
//     })
// });

module.exports = upload;