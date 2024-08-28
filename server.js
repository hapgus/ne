const app = require('./app');
// const https = require('https');
const http = require('http');

const { mongoDBConnection } = require('./utils/mongodb/mongodb');

const PORT = process.env.PORT || 3005;

// const server = https.createServer(app).listen(PORT, () => {
//   console.log(`Server live on port ${PORT}!`);
// });
const server = http.createServer(app).listen(PORT, () => {
  console.log(`Server live on port ${PORT}!`);
});

const startServer = async () => {

  await mongoDBConnection();

  try {
   
  } catch (err) {
    console.error('Error starting server:', err);
  }
}

startServer();
