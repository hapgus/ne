const HttpError = require("../models/http-error");

const admin = (req, res, next) => {
    if (!req.userData.role || (req.userData.role !== "admin" && req.userData.role !== "superAdmin")) {
        const error = new HttpError('Authorization failed - not an admin!', 403);
        return next(error);
    }
    next();
};

module.exports = admin;