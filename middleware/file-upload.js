const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');


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
        bucket: 'us-product-guide-images',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (_, file, cb) {
            console.log('MULTER FILE', file)
            let folder = 'media/images/';
            if (file.fieldname === 'qrcode' || file.fieldname.includes('resourceQrCodeImage')) {
                folder = 'media/qrcodes/';
            }
            cb(null, folder + file.originalname)

        }
    })
});

module.exports = upload;