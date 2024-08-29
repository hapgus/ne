const cors = require('cors');

const whitelist = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://product-guide-two.vercel.app/'

]

// const CorsConfig = () => cors({ origin: [whitelist] });
const CorsConfig = () => cors({ origin: whitelist });

  
module.exports = CorsConfig();


// The cors middleware is not asynchronous and does not return a Promise, so wrapping it in an async function and using await with it will have no effect. The cors middleware should be used directly or through a wrapper function that returns a middleware function. You don't need to make it async.