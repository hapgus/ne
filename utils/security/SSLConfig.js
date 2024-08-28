const fs = require('fs');

const SSL_OPTIONS = {
    key: fs.readFileSync('./key.pem'), 
    cert: fs.readFileSync('./cert.pem') 
};

module.exports = {
    SSL_OPTIONS
}