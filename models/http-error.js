class HttpError extends Error {
    constructor(message, errorCode) {
        super(message); // Add amessage'  'property
        this.code = errorCode; 
    }
}

module.exports = HttpError;