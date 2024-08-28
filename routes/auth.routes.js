const express = require('express');
const { check, body } = require('express-validator')
const authController = require('../controllers/auth.controller');
const router = express.Router();
const UserModel = require('../models/user.model');
const HttpError = require('../models/http-error');

router.post('/signin', [
    body('email')
        .notEmpty().withMessage('Email is required.')
        .trim().isEmail().withMessage('Please enter a valid email.')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required.')
        .trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
], authController.postSignin);

router.post('/signup', [
    body('email')
        .notEmpty().withMessage('Email is required.')
        .trim().isEmail().withMessage('Please enter a valid email.')
        .custom(async (value) => {
            const foundUser = await UserModel.findOne({ email: value.toLowerCase() });
            if (foundUser) { throw new HttpError('That email is not available', 409); }
        })
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required.')
        .trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        .matches(/\d/).withMessage('Password must contain a number.')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter.')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
        .matches(/[\W_]/).withMessage('Password must contain a special character.')
        .custom(value => {
            if (/\s/.test(value)) {
                throw new HttpError('Password should not contain spaces.', 409);
            }
            return true;
        }),
    body('firstName')
        .notEmpty().withMessage('First name is required.')
        .trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters long')
        .custom(value => {
            if (/  +/.test(value)) {
                throw new HttpError('First name should not contain multiple spaces.', 409);
            }
            return true;
        }),
    body('lastName')
        .notEmpty().withMessage('Last name is required.')
        .trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters long')
        .custom(value => {
            if (/  +/.test(value)) {
                throw new HttpError('Last name should not contain multiple spaces.', 409);
            }
            return true;
        }),
    body('store')
        .optional({ checkFalsy: true })
        .trim().isLength({ min: 2, max: 50 }).withMessage('Store name must be between 2 and 50 characters long')
        .custom(value => {
            if (/  +/.test(value)) {
                throw new HttpError('Store name should not contain multiple spaces.', 409);
            }
            return true;
        }),
], authController.postSignup);

module.exports = router;