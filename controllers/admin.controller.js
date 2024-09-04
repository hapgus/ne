
// const DirectoryModel = require('../models/Directory/directory.model');
// const HttpError = require('../models/http-error');
// const Products = require('../data/PRODUCT_DATA.json');
const HttpError = require('../models/http-error');
const ProductModel = require('../models/product.model');
const DeletedProductModel = require('../models/deleted-products.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { validationResult } = require('express-validator');

exports.addProduct = async (req, res, next) => {

    console.log(req.body)
    const file = req.files.find(f => f.fieldname === 'image');
    if (!file) {
        const error = new HttpError('No product image uploaded', 400);
        return next(error);
    }

    const imageURL = new URL(file.location);
    const image = imageURL.pathname.substring(1);


    // Handling QR code image
    const qrCodeFile = req.files.find(f => f.fieldname === 'qrcode');
    let qrcode = null;

    if (qrCodeFile) {
        const qrCodeURL = new URL(qrCodeFile.location);
        qrcode = qrCodeURL.pathname.substring(1);
    }
    // Process section-specific QR code images
    let sections = [];
    if (req.body.sections) {
        sections = req.body.sections.map((section, index) => {
            // Find the corresponding QR code image for this section
            const sectionQrCodeFile = req.files.find(f => f.fieldname === `sections[${index}][resourceQrCodeImage]`);
            let resourceQrCodeImage = null;

            if (sectionQrCodeFile) {
                const sectionQrCodeURL = new URL(sectionQrCodeFile.location);
                resourceQrCodeImage = sectionQrCodeURL.pathname.substring(1);
            }

            // Return the section object with the QR code image path
            return {
                ...section,
                resourceQrCodeImage, // Add the QR code image path to the section
            };
        });
    }
    const {
        availability,
        category,
        colors,
        logos,
        msrp,
        specList1,
        specList2,
        specList3,
        specList4,
        specTitle1,
        specTitle2,
        specTitle3,
        specTitle4,
        specSheetLink,
        specSheetQrcode,
        store,
        stylecategory,
        subcategory,
        subtitle,
        title,
        upc,
        videos,
        // sections,
        creator
    } = req.body

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    const newProduct = new ProductModel({
        availability,
        category,
        colors,
        logos,
        msrp,
        specList1,
        specList2,
        specList3,
        specList4,
        specTitle1,
        specTitle2,
        specTitle3,
        specTitle4,
        specSheetLink,
        specSheetQrcode,
        store,
        stylecategory,
        subcategory,
        subtitle,
        title,
        upc,
        videos,
        sections,
        image,
        qrcode,
        creator
    })

    let productCreator;

    try {
        // let productCreator = await UserModel.findById(creator);
        productCreator = await UserModel.findById(creator);
        console.log(productCreator)
        // console.log('terminator', productCreator)
        if (!productCreator || (productCreator.role !== 'admin' && productCreator.role !== 'superAdmin')) {
            return next(new HttpError('User does not have permission to add the product.', 403));
        }

        await newProduct.save()
        productCreator.productsCreated.push({
            product: newProduct._id,  // reference to the product created
            createdAt: new Date(), // current date
            productName: newProduct.title // product name or any field in the product schema
        });
        await productCreator.save();
        res.status(201).json({
            message: 'Product added',
            product: newProduct
        });
    } catch (err) {
        return next(new HttpError('Creating the product failed!' + err.message, 500));
    }
}
exports.updateProduct = async (req, res, next) => {

    const productId = req.params.productId;
    let updatedProduct;

    try {
        updatedProduct = await ProductModel.findById(productId)

    } catch (err) {
        return next(new HttpError(
            `Something went wrong could not find the product - server ${err}`, 500
        ));
    }
    console.log('body', req.body)
    const {
        availability,
        category,
        colors,
        logos,
        msrp,
        specList1,
        specList2,
        specList3,
        specList4,
        specTitle1,
        specTitle2,
        specTitle3,
        specTitle4,
        specSheetLink,
        // specSheetQrcode,
        store,
        stylecategory,
        subcategory,
        subtitle,
        title,
        upc,
        videos,

        creator
    } = req.body

    let image = updatedProduct.image;

    if (req.files && req.files.find(file => file.fieldname === 'image')) {
        const newImageFile = req.files.find(file => file.fieldname === 'image');

        const imageURL = new URL(newImageFile.location);

        image = imageURL.pathname.substring(1); // Update to the new image path

    }
    let qrcode = updatedProduct.qrcode;
    if (req.files && req.files.find(file => file.fieldname === 'qrcode')) {
        const newImageFile = req.files.find(file => file.fieldname === 'qrcode');
        console.log('new file', newImageFile)
        const imageURL = new URL(newImageFile.location);
        console.log('new url', imageURL)
        qrcode = imageURL.pathname.substring(1); // Update to the new image path
        console.log('qrcode', qrcode)

    }


    // if (req.files && req.files.qrcode) {
    //     qrcodeURL = new URL(req.files.qrcode[0].location);
    //     qrcode = qrcodeURL.pathname.substring(1);
    // } else {
    //     qrcode = updatedProduct.qrcode; // Get image URL from the existing product data
    // }
    let sections = [];
    if (req.body.sections) {
        sections = req.body.sections.map((section, index) => {
            // Find the corresponding QR code image for this section
            const sectionQrCodeFile = req.files.find(f => f.fieldname === `sections[${index}][resourceQrCodeImage]`);

            let resourceQrCodeImage = section.resourceQrCodeImage; // Use existing image URL

            if (sectionQrCodeFile) {
                const sectionQrCodeURL = new URL(sectionQrCodeFile.location);
                resourceQrCodeImage = sectionQrCodeURL.pathname.substring(1); // Update to the new image path
            }

            // Return the section object with the QR code image path
            return {
                ...section,
                resourceQrCodeImage // Add the QR code image path to the section
            };
        });
    }

    // if (req.body.sections) {
    //     sections = req.body.sections.map((section, index) => {
    //         // Find the corresponding QR code image for this section
    //         const sectionQrCodeFile = req.files.find(f => f.fieldname === `sections[${index}][resourceQrCodeImage]`);
    //         let resourceQrCodeImage = null;

    //         if (sectionQrCodeFile) {
    //             const sectionQrCodeURL = new URL(sectionQrCodeFile.location);
    //             resourceQrCodeImage = sectionQrCodeURL.pathname.substring(1);
    //         }

    //         // Return the section object with the QR code image path
    //         return {
    //             ...section,
    //             resourceQrCodeImage, // Add the QR code image path to the section
    //         };
    //     });
    // }
    updatedProduct.sections = sections;
    updatedProduct.title = title;
    updatedProduct.image = image;
    updatedProduct.qrcode = qrcode;
    updatedProduct.subtitle = subtitle;
    updatedProduct.category = category;
    updatedProduct.subcategory = subcategory;
    updatedProduct.stylecategory = stylecategory;
    updatedProduct.upc = upc;
    updatedProduct.videos = videos;
    updatedProduct.store = store;
    updatedProduct.msrp = msrp;
    updatedProduct.logos = logos;
    updatedProduct.colors = colors;
    updatedProduct.availability = availability;
    updatedProduct.specList1 = specList1;
    updatedProduct.specList2 = specList2;
    updatedProduct.specList3 = specList3;
    updatedProduct.specList4 = specList4;
    updatedProduct.specTitle1 = specTitle1;
    updatedProduct.specTitle2 = specTitle2;
    updatedProduct.specTitle3 = specTitle3;
    updatedProduct.specTitle4 = specTitle4;
    updatedProduct.specSheetLink = specSheetLink;
    // updatedProduct.specSheetQrcode = specSheetQrcode;

    console.log(updatedProduct)
    try {
        await updatedProduct.save()

    } catch (err) {
        console.log(err)
        // const error = new HttpError(
        //     `Something went wrong could not save the updated product - server ${err}`, 500
        // );
        // return next(error);
    }
    res.status(201).json({
        message: "Product updated",
        updatedProduct: updatedProduct
    })

}
exports.deleteProduct = async (req, res, next) => {

    const productId = req.params.productId;
    const terminatorId = req.body.adminId;

    console.log('product', productId)
    console.log('terminatory', terminatorId)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    let productToDelete;
    let terminator;

    try {
        terminator = await UserModel.findById(terminatorId);
        // console.log('terminator', terminator)
        if (!terminator || (terminator.role !== 'admin' && terminator.role !== 'superAdmin')) {
            return next(new HttpError('User does not have permission to delete the product.', 403));
        }
    } catch (err) {
        return next(new HttpError('Something went wrong, could not find the user.', 500));
    }

    try {
        productToDelete = await ProductModel.findById(productId);
        if (!productToDelete) {
            return next(new HttpError('Could not find product to delete.', 404));
        }
        const deletedProduct = new DeletedProductModel({
            ...productToDelete._doc,
            deletedBy: {
                userId: terminator._id,
                deletedOn: new Date()
            }
        });
        await deletedProduct.save();

        terminator.productsDeleted.push({
            productName: deletedProduct.title,
            product: deletedProduct._id,
            deletedOn: new Date()
        });
        await terminator.save();

        await ProductModel.deleteOne({ _id: productId });

    } catch (err) {
        return next(new HttpError('Something went wrong, could not delete the product. ', err, 500));
    }
    return res.status(200).json({ message: "Product deleted" });
}

exports.addAdmin = async (req, res, next) => {
    const { firstName, lastName, email, password, role, creator } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }
    const status = "approved";
    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('Password hashing failed, please try again later.', 500));
    }
    const user = new UserModel({
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        role: role,
        status: status,
        password: hashedPassword,
        createdBy: creator,
    });

    try {
        await user.save();
        let creatorUser = await UserModel.findById(creator);
        if (!creatorUser) {
            throw new HttpError('Creator user not found', 404);
        }
        creatorUser.usersCreated.push(
            {
                user: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email
            }
        );
        await creatorUser.save();

    } catch (err) {
        return next(new HttpError('Saving user or updating creator failed, please try again later.' + err, 500));
    }
    // try {
    //     await transporter.sendMail({
    //         to: email,
    //         from: 'info@suitedforweb.com',
    //         subject: 'Account confirmation',
    //         html: `
    //         <div
    //         style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F6F3EB; display: flex; flex-direction: column; align-items: flex-start; border-radius:16px;">
    //         <div styles="display: flex; align-items: center;">
    //             <div style="height: 150px; padding-left: 20px; display: flex; justify-content: center;">
    //                 <img src="${process.env.LOGO_IMAGE_PATH}"
    //                     style="height: 100%;  display:flex; width: 100%; object-fit: contain;" />
    //             </div>
    //         </div>
    //         <div
    //             style="height: inherit; background-color: white; padding:25px; margin: 0px 50px 50px 50px;  border-radius:16px; ">
    //             <div style="padding: 5px 0 10px 0;">
    //                 <div >
    //                     <!-- <p style="font-size: 14px;  color: #716F6A;">Hello ${firstName},</p> -->
    //                     <h1 style="font-size: 24px; color: #716F6A; margin-bottom: 20px;">
    //                         Product Guide Admin Account
    //                     </h1>
    //                 </div>
    //                 <div style="display: flex; flex-direction: column; row-gap: 10px; ">
    //                     <p style="font-size: 14px; color: #716F6A; line-height: 1.7;">
    //                         Your admin account is now active. You can now login.
    //                         <!-- Your account registration is currently being processed, and once approved, you will receive an email notification. This email will confirm that your account is active and ready for you to dive into the full potential of our Product Guide.  If you have any questions or need assistance, please don't hesitate to reach out to our support team at lgproductguide@gmail.com. We're here to help! -->
    //                     </p>
    //                     <p style="font-size: 14px; color: #716F6A; line-height: 1.7;">
    //                         If you have any questions or need assistance, please don't hesitate to reach out to our support team
    //                         at lgproductguide@gmail.com. We're here to help!
    //                     </p>
    //                 </div>
    //                 <div>
    //                     <p style="font-size: 14px; color: #716F6A">Thank you,</p>
    //                     <p style="font-size: 14px; color: #716F6A; padding-top: 15px;">LG Training Team</p>
    //                 </div>
    //             </div>
    //             <div style="border-top: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px;
    //                     border-bottom: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px; margin-bottom: 10px;">
    //                 <p style="font-size: 12px; color:#D0CBC1;">This message was sent from LG Home Appliances Product Guide.</p>
    //             </div>
    //             <div style="padding: 5px 0 10px 0;">
    //                 <div>
    //                     <!-- <p style="font-size: 14px;  color: #716F6A;">Hello ${firstName},</p> -->
    //                     <h1 style="font-size: 24px; color: #716F6A; margin-bottom: 20px;">
    //                         Guide produit Compte administrateur
    //                     </h1>
    //                 </div>
    //                 <div style="display: flex; flex-direction: column; row-gap: 10px; ">
    //                     <p style="font-size: 14px; color: #716F6A; line-height: 1.7;">
    //                         Votre compte administrateur est maintenant actif. Vous pouvez maintenant vous connecter.
    //                     </p>
    //                     <p style="font-size: 14px; color: #716F6A; line-height: 1.7;">
    //                         Si vous avez des questions ou avez besoin d'aide, n'hésitez pas à contacter notre équipe
    //                         d'assistance
    //                         à lgproductguide@gmail.com. Nous sommes là pour vous aider !
    //                     </p>
    //                 </div>
    //                 <div>
    //                     <p style="font-size: 14px; color: #716F6A">Merci,</p>
    //                     <p style="font-size: 14px; color: #716F6A; padding-top: 15px;">Équipe de formation LG</p>
    //                 </div>
    //             </div>
    //             <div style="border-top: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px;
    //                     border-bottom: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px; margin-bottom: 10px;">
    //                 <p style="font-size: 12px; color:#D0CBC1;">Ce message a été envoyé à partir du Guide des produits LG Home Appliances.</p>
    //             </div>
    //         </div>

    //     </div>`

    //     });
    // } catch (err) {
    //     console.error('Sending confirmation email failed: ', err);
    // }

    let token;
    try {
        token = jwt.sign({
            userId: user._id,
            userEmail: user.email
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Creating a token failed, please try again later.', 500));
    }

    return res.status(201).json({
        message: 'New user added.',
        token: token,
        userId: user._id,
        userEmail: user.email,
        creator: user.creator,
        user: user,
    });
};

exports.manageUser = async (req, res, next) => {
    const userAccountId = req.params.userId;
    const { creatorId, role, status } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    if (userAccountId === creatorId) {
        return next(new HttpError('That operation is not allowed.', 403));
    }

    try {
        const creator = await UserModel.findById(creatorId);
        if (!creator || creator.role !== 'superAdmin') {
            return next(new HttpError('User does not have permission to update other users.', 403));
        }

        const userToBeUpdated = await UserModel.findById(userAccountId);
        if (!userToBeUpdated) {
            return next(new HttpError('User to update not found.', 404));
        }

        const updateFields = {};
        if (userToBeUpdated.role !== role) updateFields.role = role;
        if (userToBeUpdated.status !== status) updateFields.status = status;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "User role or status is already set to this value." });
        }

        await UserModel.updateOne({ _id: userAccountId }, { $set: updateFields });

        creator.usersUpdated.push({
            userId: userToBeUpdated._id,
            name: `${userToBeUpdated.firstName} ${userToBeUpdated.lastName}`,
            updatedOn: new Date(),
        });

        await creator.save();

        return res.status(202).json({ message: "User updated successfully.", userId: userToBeUpdated._id });

    } catch (err) {
        console.error(err);
        return next(new HttpError('Something went wrong, could not update user.', 500));
    }
};


exports.getAdminUsers = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }
    try {
        // Query MongoDB directly for admin or superadmin users
        const admins = await UserModel.find({ role: { $in: ['admin', 'superAdmin'] } });

        if (!admins || admins.length === 0) {
            return next(new HttpError('No admin users found.', 404));
        }

        const usersToSend = admins.map(user => {
            return {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                joined: user.createdAt,
                updated: user.updatedAt,

                productsCreated: user.productsCreated.length,
                productsUpdated: user.productsUpdated.length,
                productsDeleted: user.productsDeleted.length,
                usersCreated:user.usersCreated.length,
                usersUpdated:user.usersUpdated.length,
                usersDeleted:user.usersDeleted.length,
            }
        })

        return res.status(200).json({
            users: usersToSend,
            message: 'admins - server'
        })

    } catch (err) {
        return next(new HttpError('Something went wrong, could not find users. ', 500));
    }
}

exports.getUsers = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }
    try {

        const users = await UserModel.find({ role: { $in: ['user'] } });

        if (!users) {
            return next(new HttpError('No users found.', 404))
        }


        const usersToSend = users.map(user => {
            return {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                store: user.store,
                role: user.role,
                status: user.status,
                joined: user.createdAt,
                updated: user.updatedAt
            }
        })

        return res.status(200).json({
            users: usersToSend,
            message: 'All users - server'
        })

    } catch (err) {
        return next(new HttpError('Something went wrong, could not find users. ', 500));
    }
}


exports.getUser = async (req, res, next) => {
    const userAccountId = req.params.userId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }
    try {
        const user = await UserModel.findById(userAccountId);

        if (!user) {
            return next(new HttpError('No users found.', 404))
        }
        return res.status(200).json({
            user: user,
            message: 'user - server'
        })

    } catch (err) {
        return next(new HttpError('Something went wrong, could not find the user. ', 500));
    }
}


// exports.addProduct = async (req, res, next) => {

//     const { creator } = req.body

//     console.log(req.body)

//     try {
//         res.status(201).json({
//             message: `Creator is ${creator} `,

//         });

//     } catch (err) {

//         return next(new HttpError('Creating the product failed!' + err.message, 500));
//     }
// }

// exports.data = async (req, res, next) => {
//     // try {
//     //     const data = await readCache();
//     //     if (data) {
//     //         res.json(data);
//     //     } else {
//     //         res.status(404).json({ message: "Data not found" });
//     //     }
//     // } catch (error) {
//     //     res.status(500).json({ message: "Server error occurred" });
//     //     next(error);
//     // }
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return next(new HttpError(errors.array()[0].msg, 422));
//     }
//     try {
//         const data = await getFromS3('dataCache.json');
//         res.json(JSON.parse(data));
//     } catch (error) {
//         console.error("Error fetching data:", error);
//         // res.status(500).json({ error: 'Internal Server Error' });
//         return next(new HttpError('Something went wrong' + err, 500));
//     }
// }





exports.deleteAdmin = async (req, res, next) => {
    const userId = req.params.userId;
    const terminatorId = req.body.adminId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    if (userId === terminatorId) {
        return next(new HttpError('That operation is not allowed.', 403));
    }

    let userToDelete;
    let terminator;
    try {
        terminator = await UserModel.findById(terminatorId);

        if (!terminator || (terminator.role !== 'superAdmin')) {
            return next(new HttpError('User does not have permission..', 403));
        }
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update the user.', 500));
    }

    try {
        userToDelete = await UserModel.findById(userId)

        if (!userToDelete) {
            return next(new HttpError('User to delete not found.', 404));
        }
        await UserModel.deleteOne({ _id: userId });
        terminator.usersDeleted.push({
            userId: userToDelete._id,
            name: `${userToDelete.firstName} ${userToDelete.lastName}`,
            email: userToDelete.email,
            deletedOn: new Date()
        })
        await terminator.save();

    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Something went wrong could not find user by ID to delete - server', 500
        );
        return next(error);
    }


    res.status(200).json({
        message: "user deleted"
    })
}

exports.deleteUser = async (req, res, next) => {
    const userId = req.params.userId;
    const terminatorId = req.body.adminId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    if (userId === terminatorId) {
        return next(new HttpError('That operation is not allowed.', 403));
    }

    try {
        const terminator = await UserModel.findById(terminatorId);

        if (!terminator || (terminator.role !== 'superAdmin' && terminator.role !== 'admin')) {
            return next(new HttpError('User does not have permission.', 403));
        }

        const userToDelete = await UserModel.findById(userId);

        if (!userToDelete) {
            return next(new HttpError('User to delete not found.', 404));
        }

        await UserModel.deleteOne({ _id: userId });

        terminator.usersDeleted.push({
            userId: userToDelete._id,
            name: `${userToDelete.firstName} ${userToDelete.lastName}`,
            email: userToDelete.email,
            deletedOn: new Date(),
        });

        await terminator.save();

        res.status(200).json({ message: "User deleted" });

    } catch (err) {
        console.log(err);
        return next(new HttpError('Something went wrong, could not delete user.', 500));
    }
};

exports.updateUserRole = async (req, res, next) => {
    const userAccountId = req.params.userId;
    const creatorId = req.body.adminId;
    const role = req.body.role;
    console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    if (userAccountId === creatorId) {
        return next(new HttpError('That operation is not allowed.', 403));
    }
    let userToBeUpdated;
    let creator;

    try {
        creator = await UserModel.findById(creatorId);
        if (!creator || (creator.role !== 'superAdmin')) {
            return next(new HttpError('User does not have permission to update other users.', 403));
        }
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update the user.', 500));
    }

    try {
        userToBeUpdated = await UserModel.findById(userAccountId);
        if (!userToBeUpdated) {
            return next(new HttpError('User to update not found.', 404));
        }

        // Check if the new status is the same as the current one
        if (userToBeUpdated.role === role) {
            return res.status(400).json({ message: "User role is already set to this value." });
        }

        userToBeUpdated.role = role;
        await userToBeUpdated.save();
        // creator.usersUpdated.push(userToBeUpdated._id);
        creator.usersUpdated.push({
            userId: userToBeUpdated._id,
            name: `${userToBeUpdated.firstName} ${userToBeUpdated.lastName}`,
            updatedOn: new Date()
        });
        await creator.save();
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update user role. ', 500));
    }
    return res.status(201).json({ message: "User role updated.", userId: userToBeUpdated._id });
}


exports.updateUserStatus = async (req, res, next) => {
    const userAccountId = req.params.userId;
    const creatorId = req.body.adminId;
    const status = req.body.status;
    console.log('req body', req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }

    if (userAccountId === creatorId) {
        return next(new HttpError('That operation is not allowed.', 403));
    }
    let userToBeUpdated;
    let creator;

    try {
        creator = await UserModel.findById(creatorId);
        if (!creator || (creator.role !== 'superAdmin')) {
            return next(new HttpError('User does not have permission to update other users.', 403));
        }
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update the user.', 500));
    }

    try {
        userToBeUpdated = await UserModel.findById(userAccountId);
        console.log('user to be updated', userToBeUpdated)
        if (!userToBeUpdated) {
            return next(new HttpError('User to update not found.', 404));
        }

        // Check if the new status is the same as the current one
        if (userToBeUpdated.status === status) {
            return res.status(400).json({ message: "User status is already set to this value." });
        }
        if (!userToBeUpdated.status) {
            return res.status(400).json({ message: "User status cannot be set." });
        }
        userToBeUpdated.status = status;
        await userToBeUpdated.save();
        // creator.usersUpdated.push(userToBeUpdated._id);
        creator.usersUpdated.push({
            userId: userToBeUpdated._id,
            name: `${userToBeUpdated.firstName} ${userToBeUpdated.lastName}`,
            updatedOn: new Date()
        });
        await creator.save();
    } catch (err) {
        return next(new HttpError('Something went wrong, could not update user status. ', 500));
    }
    return res.status(201).json({ message: "User status updated.", userId: userToBeUpdated._id });
}


