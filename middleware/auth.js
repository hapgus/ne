const jwt = require('jsonwebtoken');

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        if(!token) {
            throw new Error('Authentication failed!');
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // req.userData = {userId: decodedToken.userId};
        req.userData = {userId: decodedToken.userId, role: decodedToken.role};
        next();

    } catch (err) {
        const error = new HttpError('Authentication failed from auth file!', 401);
        return next(error); 
    }   

};