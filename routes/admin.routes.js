// //--------------------------------
// //-------PRIVATE:ADMIN ROUTES
// //--------------------------------
// //-------LOCAL IMPORTS
const express = require('express');
// const { fileUpload, productImageFiles } = require('../middleware/file-upload');
const adminController = require("../controllers/admin.controller");
const router = express.Router();
const Auth = require('../middleware/auth');
const Admin = require('../middleware/admin');
const { check, body } = require('express-validator');
const UserModel = require('../models/user.model');
// const ProductModel = require('../models/product.model');
const HttpError = require('../models/http-error');
const upload = require('../middleware/file-upload')

// //PROTECT ALL ROUTES
// // router.use(Auth);

router.post('/add-product', upload.any(),
    // , Auth, Admin, [
    // body('creator').trim().notEmpty().withMessage('Creator required.')
    //     .custom(async (value) => {
    //         try {
    //             const foundCreator = await UserModel.findById(value);
    //             if (!foundCreator) { throw new HttpError('Creator not found', 404) }
    //             if (foundCreator.role !== 'superAdmin') { throw new HttpError('Invalid creator', 403) }
    //         } catch (err) {throw new HttpError(err.message, err.statusCode)}
    //     }),
    // //SCREEN FOR DUPLICATE Title
    // body('title').trim().notEmpty().withMessage('title cannot be empty')
    //     .custom(async (value) => {
    //         const foundProduct = await ProductModel.findOne({ title: value });
    //         if (foundProduct) { throw new HttpError('Product with that title already exist.', 409) }
    //     }),
    // check('msrp')
    //     .notEmpty().withMessage('MSRP required')
    //     .isLength({ min: 0, max: 10 }).withMessage('MSRP must be between 0-10 characters.'),
    // check('subtitle')
    //     .notEmpty().withMessage('Subtitle required')
    //     .isLength({ min: 8, max: 300 }).withMessage('English subtitle min 8 max 300 characters'),
    // body('category')
    //     .notEmpty().withMessage('Category required')
    //     .isIn(['cooking', 'dishwashers', 'laundry', 'refrigeration', 'studio', 'signature, vacuums, air care'])
    //     .withMessage('That category is not available.'),
    // body('subcategory').notEmpty().withMessage('Subcategory required'),
    // body('colour').trim().notEmpty().withMessage('Minimum 1 colour selection'),
    // ], 
    adminController.addProduct);

router.patch('/edit-product/:productId', upload.any(), adminController.updateProduct);

router.delete('/delete-product/:productId',
    // Auth, Admin, 
    adminController.deleteProduct)



router.post('/add-admin', [
    body('creator').trim().notEmpty().withMessage('Creator required.')
        .custom(async (value) => {
            try {
                const foundCreator = await UserModel.findById(value);
                if (!foundCreator) { throw new HttpError('Creator not found', 404) }
                if (foundCreator.role !== 'superAdmin') { throw new HttpError('Invalid creator', 403) }
            } catch (err) { throw new HttpError(err.message, err.statusCode); }
        }),
    body('email')
        .notEmpty().withMessage('Email is required.')
        .trim().isEmail().withMessage('Please enter a valid email.')
        .custom(async (value) => {
            const foundUser = await UserModel.findOne({ email: value.toLowerCase() });
            if (foundUser) { throw new HttpError('That email is not available', 409); }
        })
        .normalizeEmail(),
],
    //     Auth, Admin, [
    //     body('creator').trim().notEmpty().withMessage('Creator required.')
    //         .custom(async (value) => {
    //             try {
    //                 const foundCreator = await UserModel.findById(value);
    //                 if (!foundCreator) { throw new HttpError('Creator not found', 404) }
    //                 if (foundCreator.role !== 'superAdmin') { throw new HttpError('Invalid creator', 403) }
    //             } catch (err) { throw new HttpError(err.message, err.statusCode); }
    //         }),
    //     body('email').trim().notEmpty().withMessage('Email required')
    //         .isEmail().withMessage('Please enter valid email.')
    //         //SCREEN FOR DUPLICATE USER EMAIL
    //         .custom(async (value) => {
    //             const foundUser = await UserModel.findOne({ email: value.toLowerCase() });
    //             if (foundUser) { throw new HttpError('That email is not available', 409) }
    //         }),
    //     body('password', 'Please enter a password of at least 8 characters.')
    //         .trim().isLength({ min: 8 }),
    //     body('firstName')
    //         .trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
    //     body('lastName')
    //         .trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
    //     body('role')
    //         .trim().notEmpty().withMessage('Role needs to be defined!')
    //         .isIn(['admin', 'superAdmin',]).withMessage('Invalid role assignment'),
    // ],
    adminController.addAdmin);

router.get('/admin-users', adminController.getAdminUsers);
router.get('/users', adminController.getUsers);
// router.get('/data', 
//     // Auth, Admin, 
//     adminController.data);

// router.get('/all-saved-lists', adminController.getAllSavedLists);


// //-------READ-------//
// // router.get('/products', adminController.getProducts);

router.get('/user/:userId', adminController.getUser);

// router.get('/admin-users/', Auth, Admin, adminController.getAdminUsers)
// // router.get('/account-tracking-data/:userId', adminController.getTrackingData)
// // router.get('/all-tracking-data/', Auth, Admin, adminController.getAllTrackingData)

// //-------UPDATE-------//

// router.patch('/edit-product/:productId', Auth, Admin, fileUpload.fields(productImageFiles), [

//     body('creator').trim().notEmpty().withMessage('Creator required.')
//         .custom(async (value) => {
//             try {
//                 const foundCreator = await UserModel.findById(value);
//                 if (!foundCreator) {
//                     throw new HttpError('Creator not found', 404);
//                 }
//                 // if( foundCreator.role !== 'superAdmin') {
//                 //     throw new HttpError('Invalid creator', 403);
//                 // }
//             } catch (err) {
//                 throw new HttpError(err.message, err.statusCode);
//             }
//         }),

//     body('title')
//         .trim().notEmpty()
//         .withMessage('title cannot be empty')
//         .custom(async (value, { req }) => {
//             const productId = req.params.productId;
//             const foundProduct = await ProductModel.findOne({
//                 title: value,
//                 _id: { $ne: productId }
//             });
//             if (foundProduct) {
//                 throw new HttpError('Product with that title already exist.', 409);
//             }
//         }),
//     check('msrp').notEmpty().withMessage('MSRP required')
//         .isLength({ min: 0, max: 10 }).withMessage('MSRP must be between 0-10 characters.'),
//     check('subtitleEN').notEmpty().withMessage('English subtitle required')
//         .isLength({ min: 8, max: 300 }).withMessage('English subtitle min 8 max 300 characters'),

//     body('subtitleFR').trim().notEmpty().withMessage('French subtitle required')
//         .isLength({ min: 8, max: 300 }).withMessage('French subtitle min 8 max 300 characters'),

//     body('category').notEmpty().withMessage('English category required')
//         .isIn(['Cooking', 'Dishwasher', 'Laundry', 'Refrigeration', 'LG Studio'])
//         .withMessage('Category can be one of the following: Cooking, Dishwasher, Laundry, Refrigeration or LG Studio.'),
//     body('subcategory').notEmpty().withMessage('English subcategory required')
//         .isIn(
//             [
//                 //LG STUDIO
//                 'Laundry',
//                 'Refrigeration',
//                 "Built-in Cooking",
//                 "Free-standing Cooking",
//                 "Ventilation",
//                 'Dishwashers',

//                 //LAUNDRY
//                 'Front Load',
//                 'WashTower',
//                 'Top Load',
//                 'Specialty Laundry',

//                 //REFRIGERATION
//                 `36" French Door Counter Depth`,
//                 `36" French Door Standard Depth`,
//                 `33" French Door Counter Depth`,
//                 `33" French Door Standard Depth`,
//                 `30" French Door`,
//                 'Top and Bottom Mount',
//                 'Side-by-Side',
//                 'Column',
//                 'Kimchi',
//                 //COOKING
//                 "Electric Slide-in Ranges",
//                 "Electric Free-standing Ranges",
//                 "Induction Ranges",
//                 'Gas Ranges',
//                 "Wall Ovens",
//                 "Cooktops",
//                 'Over-the-Range Microwaves',
//                 'Countertop Microwaves',
//                 'Built-in',
//             ])
//         .withMessage('English subcategory not found!'),
//     body('colour').trim().notEmpty().withMessage('Minimum 1 colour selection'),
// ], adminController.patchEditProduct);

// // router.patch('/edit-user/:userId', adminController.patchEditUser); // IS THIS STILL USED?



// //UPDATE USER STATUS
router.patch('/edit-user-status/:userId',
    // Auth, Admin,
    // [
    //     body('status').trim().notEmpty().withMessage('Status cannot be empty')
    //         .isIn(['approved', 'notApproved', 'pending']).withMessage('Invalid selection'),
    // ],

    adminController.updateUserStatus);

//UPDATE USER ROLE
router.patch('/edit-user-role/:userId',
    // Auth, Admin,
    // [
    //     body('role').trim().notEmpty().withMessage('Role cannot be empty')
    //         .isIn(['user', 'admin', 'superAdmin']).withMessage('Invalid selection'),
    // ],
    adminController.updateUserRole);


router.patch('/manage-user/:userId',
    // Auth, Admin,
    // [
    //     body('role').trim().notEmpty().withMessage('Role cannot be empty')
    //         .isIn(['user', 'admin', 'superAdmin']).withMessage('Invalid selection'),
    // ],
    adminController.manageUser);




// //-------DELETE-------//

router.delete('/delete-admin/:userId',
    // Auth, Admin,

    adminController.deleteAdmin);

router.delete('/delete-user/:userId', adminController.deleteUser)
// router.delete('/remove-user-account/:userId', Auth, Admin, adminController.removeUserAccount)

// //-------GLOBAL EXPORT
module.exports = router;