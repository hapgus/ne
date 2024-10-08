require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const CorsConfig = require('./utils/security/CorsConfig');
const mainRoutes = require("./routes/main.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const { startScheduledTasks } = require('./utils/scheduler');
// const multer = require('multer');
// const { initializeAWS } = require('./utils/aws/AwsConfig');
// const { mongoDBConnection } = require('./utils/mongodb/mongodb');
// const ProductModel = require('./models/product.model');
// const products = require('./data/PRODUCT_DATA_V2.json');

const app = express();
// Middleware to log all requests
// app.use((req, res, next) => {
//   console.log(`app-1: Received request body ${req.body}`);
//   console.log(`app-1: Received request for ${req.url}`);
//   next(); // Pass control to the next middleware
// });
app.use(CorsConfig);
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



// To parse `multipart/form-data`
// const upload = multer();
// app.use(upload.none()); 
// This will handle multipart form data without files

app.use(mainRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use(userRoutes);

app.use((req, res, next) => {
  const error = new HttpError('The Page not found.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    console.error('Headers were already sent. Error:', error);
    return;
  }
  res.status(error.code || 500);
  res.json({
    message: error.message || 'An unknown error occurred!'
  });
});

// function toTitleCase(str) {
//   if (typeof str !== 'string') return str;
//   return str
//     .toLowerCase()  // Convert the entire string to lowercase first
//     .split(' ')     // Split the string into an array of words
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Capitalize the first letter of each word
//     .join(' ');     // Join the array back into a single string
// }
// initializeAWS();
mongoose.connect(

  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.bkiorpz.mongodb.net/${process.env.MONGO_CLUSTER}?retryWrites=true&w=majority&appName=${process.env.MONGO_CLUSTER}`
)
  // mongoDBConnection()
  //RUN SERVER ----------------------------------------//
  .then(activateServer => {
    app.listen(process.env.PORT || 3005);
    // Start the scheduled tasks  
    startScheduledTasks();
  })
  .catch(err => {
    console.log('Could not connect!', err);
  });

  //----------------------------------------//
  // ------USE TO PUSH DATA V2 ------
  // .then(() => {
  //   console.log('Connected to MongoDB');

  //   // Loop through the products and save each one to the database
  //   products.forEach((product) => {

  //     // Modify the image property to include the path
  //     if (product.image) {
  //       product.image = `media/images/${product.image}`;
  //     }

  //     // Convert spectTitles to title case only if they exist
  //     if (product.specTitle1) product.specTitle1 = toTitleCase(product.specTitle1);
  //     if (product.specTitle2) product.specTitle2 = toTitleCase(product.specTitle2);
  //     if (product.specTitle3) product.specTitle3 = toTitleCase(product.specTitle3);
  //     if (product.specTitle4) product.specTitle4 = toTitleCase(product.specTitle4);

  //    // Rename specSheetQrcode to qrcode even if it's an empty string or null
  //    if (product.hasOwnProperty('specSheetQrcode')) {
  //     product.qrcode = product.specSheetQrcode;  // Assign the value to the new property
  //     delete product.specSheetQrcode;  // Delete the old property
  // }

  //     // Check if product already exists in the database
  //     ProductModel.findOne({ title: product.title })
  //       .then((existingProduct) => {
  //         // If product does not exist, save it
  //         if (!existingProduct) {
  //           const newProduct = new ProductModel(product);
  //           newProduct.save()
  //             .then(() => {
  //               console.log(`Saved product ${product.title} to the database`);
  //             })
  //             .catch((err) => {
  //               console.error(`Error saving product ${product.title}: ${err}`);
  //             });
  //         } else {
  //           console.log(`Product ${product.title} already exists in the database`);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error(`Error checking product ${product.title}: ${err}`);
  //       });
  //   });
  // })
  // .catch((err) => {
  //   console.error(`Error connecting to MongoDB: ${err}`);
  // });

// ------USE TO PUSH DATA V2 END------

//----------------------------------------//
// ------USE TO PUSH DATA ------
//   .then(() => {
//     console.log('Connected to MongoDB');

//     // Loop through the products and save each one to the database
//     products.forEach((product) => {
//         // Check if product already exists in the database
//         ProductModel.findOne({ title: product.title })
//             .then((existingProduct) => {
//                 // If product does not exist, save it
//                 if (!existingProduct) {
//                     const newProduct = new ProductModel(product);
//                     newProduct.save()
//                         .then(() => {
//                             console.log(`Saved product ${product.title} to the database`);
//                         })
//                         .catch((err) => {
//                             console.error(`Error saving product ${product.title}: ${err}`);
//                         });
//                 } else {
//                     console.log(`Product ${product.title} already exists in the database`);
//                 }
//             })
//             .catch((err) => {
//                 console.error(`Error checking product ${product.title}: ${err}`);
//             });
//     });
// })
// .catch((err) => {
//     console.error(`Error connecting to MongoDB: ${err}`);
// });


// ------USE TO PUSH DATA ------
// module.exports = app;

