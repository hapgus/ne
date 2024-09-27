
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
const {getFromS3} = require('../middleware/data-upload')

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEYS);  

exports.addProduct = async (req, res, next) => {

    console.log(req.body)
    // const errors = validationResult(req);

    // if (!errors.isEmpty()) {
    //     return next(new HttpError(errors.array()[0].msg, 422));
    // }


    // const imageFile = req.files.find(f => f.fieldname === 'image');
    // let image = null;

    // if (imageFile) {
    //     const imageURL = new URL(file.location);
    //     image = imageURL.pathname.substring(1);
    // }


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
    console.log(errors)

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

exports.copyProduct = async (req, res, next) => {
    console.log('BODY',req.body)

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
        sections: incomingSections,
        creator
    } = req.body

    // console.log(req.body)
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return next(new HttpError(errors.array()[0].msg, 422));
    // }

    // let image = req.body.image;

    // if (req.files && req.files.find(file => file.fieldname === 'image')) {
    //     const newImageFile = req.files.find(file => file.fieldname === 'image');

    //     const imageURL = new URL(newImageFile.location);

    //     image = imageURL.pathname.substring(1); // Update to the new image path

    // }
    // let qrcode = req.body.image;
    // if (req.files && req.files.find(file => file.fieldname === 'qrcode')) {
    //     const newImageFile = req.files.find(file => file.fieldname === 'qrcode');
    //     console.log('new file', newImageFile)
    //     const imageURL = new URL(newImageFile.location);
    //     console.log('new url', imageURL)
    //     qrcode = imageURL.pathname.substring(1); // Update to the new image path
    //     console.log('qrcode', qrcode)

    // }


  
    // let sections = [];
    // if (req.body.sections) {
    //     sections = req.body.sections.map((section, index) => {
    //         // Find the corresponding QR code image for this section
    //         const sectionQrCodeFile = req.files.find(f => f.fieldname === `sections[${index}][resourceQrCodeImage]`);

    //         let resourceQrCodeImage = section.resourceQrCodeImage; // Use existing image URL

    //         if (sectionQrCodeFile) {
    //             const sectionQrCodeURL = new URL(sectionQrCodeFile.location);
    //             resourceQrCodeImage = sectionQrCodeURL.pathname.substring(1); // Update to the new image path
    //         }

    //         // Return the section object with the QR code image path
    //         return {
    //             ...section,
    //             resourceQrCodeImage // Add the QR code image path to the section
    //         };
    //     });
    // }
     // 1. Handle the main product image
     let image = req.body.image; // Use existing image if provided
     console.log('image', image)

     if (req.files && req.files.find(file => file.fieldname === 'image')) {
       const newImageFile = req.files.find(file => file.fieldname === 'image');
       console.log('new image', newImageFile)
       const imageURL = new URL(newImageFile.location);
       console.log('new url', imageURL)
       image = imageURL.pathname.substring(1); // Replace with new image if uploaded
       console.log('new image replacement', image)
     }
 
     // 2. Handle the QR code (if exists)
     let qrcode = req.body.qrcode; // Use existing QR code if provided
 
     if (req.files && req.files.find(file => file.fieldname === 'qrcode')) {
       const newQrCodeFile = req.files.find(file => file.fieldname === 'qrcode');
       const qrCodeURL = new URL(newQrCodeFile.location);
       qrcode = qrCodeURL.pathname.substring(1); // Replace with new QR code if uploaded
     }
 
     // 3. Handle sections, including images (QR codes) within sections
     let sections = [];
     if (incomingSections) {
       sections = incomingSections.map((section, index) => {
         // Use the existing section image (if provided) or update if a new file is uploaded
         let resourceQrCodeImage = section.resourceQrCodeImage;
 
         const sectionQrCodeFile = req.files.find(f => f.fieldname === `sections[${index}][resourceQrCodeImage]`);
         if (sectionQrCodeFile) {
           const sectionQrCodeURL = new URL(sectionQrCodeFile.location);
           resourceQrCodeImage = sectionQrCodeURL.pathname.substring(1); // Update with new QR code
         }
 
         // Return the updated section object
         return {
           ...section,
           resourceQrCodeImage
         };
       });
     }
 
    
    console.log({'OBJECTS image':image,'OBJECTS qrcode':qrcode,'OBJECTS sections':sections})
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }
    console.log(errors)

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
        creatorUser.usersCreated.push({
            user: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
        });
        await creatorUser.save();

    } catch (err) {
        return next(new HttpError('Saving user or updating creator failed, please try again later.' + err, 500));
    }

    // Send confirmation email using SendGrid
    const msg = {
        to: email,
        from: 'productguide@teamlg.ca',  // Your verified sender email
        subject: 'Admin Account Confirmation',
        html: `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Admin Account Confirmation</title>
              </head>
              <body
                style="font-family: Arial, sans-serif; background-color: #f6f3eb; margin: 0; padding: 0;"
              >
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                  style="max-width: 600px; margin: 0 auto; background-color: #f6f3eb;"
                >
                  <tr>
                    <td style="padding: 20px;">
                      <!-- LOGO SECTION -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td align="center" style="padding-bottom: 20px;">
                            <img
                              src="${process.env.LOGO_IMAGE_PATH}"
                              alt="LG Logo"
                              width="150"
                              style="display: block; height: auto;"
                            />
                          </td>
                        </tr>
                      </table>

                      <!-- MAIN CONTENT -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                        style="background-color: #ffffff; padding: 25px; border-radius: 8px;"
                      >
                        <tr>
                          <td>
                            <h1
                              style="font-size: 24px; color: #716f6a; margin-bottom: 20px;"
                            >
                              Admin Account Confirmation
                            </h1>
                            <p
                              style="font-size: 16px; color: #716f6a; line-height: 1.6; margin-bottom: 20px;"
                            >
                              Your admin account has been created. You can now log in using your credentials.
                            </p>
                            <p
                              style="font-size: 16px; color: #716f6a; line-height: 1.6; margin-bottom: 20px;"
                            >
                              If you have any questions, please reach out to our support
                              team at <a href="mailto:lgproductguide@gmail.com">lgproductguide@gmail.com</a>.
                            </p>
                            <p style="font-size: 16px; color: #716f6a;">
                              Thank you,
                              <br />
                              LG Training Team
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- FOOTER -->
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                        style="padding-top: 10px; border-top: 1px solid #d0cbc1; margin-top: 20px;"
                      >
                        <tr>
                          <td align="center" style="padding: 10px 0;">
                            <p style="font-size: 12px; color: #d0cbc1;">
                              This message was sent from LG Home Appliances Product Guide.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `,
    };

    try {
        await sgMail.send(msg);  // Send the email using SendGrid
        console.log('Admin confirmation email sent successfully.');
    } catch (err) {
        console.error('Error sending email:', err);
        return next(new HttpError('Sending confirmation email failed.', 500));
    }

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
        message: 'New admin added.',
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

        // Check if status change is from 'pending' to 'approved'
        const sendApprovalEmail = userToBeUpdated.status === 'pending' && status === 'approved';

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

        // Send congratulatory email if status is changed to approved
        if (sendApprovalEmail) {
            const msg = {
                to: userToBeUpdated.email,
                from: 'productguide@teamlg.ca',  // Your verified sender email
                subject: 'Congratulations! Your Account Has Been Approved',
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                      <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>Account Approved</title>
                      </head>
                      <body
                        style="font-family: Arial, sans-serif; background-color: #f6f3eb; margin: 0; padding: 0;"
                      >
                        <table
                          role="presentation"
                          cellspacing="0"
                          cellpadding="0"
                          border="0"
                          width="100%"
                          style="max-width: 600px; margin: 0 auto; background-color: #f6f3eb;"
                        >
                          <tr>
                            <td style="padding: 20px;">
                              <!-- LOGO SECTION -->
                              <table
                                role="presentation"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                width="100%"
                              >
                                <tr>
                                  <td align="center" style="padding-bottom: 20px;">
                                    <img
                                      src="${process.env.LOGO_IMAGE_PATH}"
                                      alt="LG Logo"
                                      width="150"
                                      style="display: block; height: auto;"
                                    />
                                  </td>
                                </tr>
                              </table>

                              <!-- MAIN CONTENT -->
                              <table
                                role="presentation"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                width="100%"
                                style="background-color: #ffffff; padding: 25px; border-radius: 8px;"
                              >
                                <tr>
                                  <td>
                                    <h1
                                      style="font-size: 24px; color: #716f6a; margin-bottom: 20px;"
                                    >
                                      Congratulations! Your Account is Approved
                                    </h1>
                                    <p
                                      style="font-size: 16px; color: #716f6a; line-height: 1.6; margin-bottom: 20px;"
                                    >
                                      We're excited to inform you that your account has been approved. You now have full access to the Product Guide!
                                    </p>
                                    <p
                                      style="font-size: 16px; color: #716f6a; line-height: 1.6; margin-bottom: 20px;"
                                    >
                                      If you have any questions, please reach out to our support team at <a href="mailto:lgproductguide@gmail.com">lgproductguide@gmail.com</a>.
                                    </p>
                                    <p style="font-size: 16px; color: #716f6a;">
                                      Thank you,
                                      <br />
                                      LG Training Team
                                    </p>
                                  </td>
                                </tr>
                              </table>

                              <!-- FOOTER -->
                              <table
                                role="presentation"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                width="100%"
                                style="padding-top: 10px; border-top: 1px solid #d0cbc1; margin-top: 20px;"
                              >
                                <tr>
                                  <td align="center" style="padding: 10px 0;">
                                    <p style="font-size: 12px; color: #d0cbc1;">
                                      This message was sent from LG Home Appliances Product Guide.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </body>
                    </html>
                `,
            };

            try {
                await sgMail.send(msg);
                console.log('Approval email sent successfully.');
            } catch (err) {
                console.error('Error sending email:', err);
            }
        }

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
                userId: user._id,

                productsCreated: user.productsCreated.length,
                productsUpdated: user.productsUpdated.length,
                productsDeleted: user.productsDeleted.length,
                usersCreated: user.usersCreated.length,
                usersUpdated: user.usersUpdated.length,
                usersDeleted: user.usersDeleted.length,
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
                updated: user.updatedAt,
                userId: user._id
            }

        })
        console.log(usersToSend.userId)
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



exports.data = async (req, res, next) => {
    console.log(req)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 422));
    }
    try {
        const data = await getFromS3('dataCache.json');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error fetching data:", error);
        // res.status(500).json({ error: 'Internal Server Error' });
        return next(new HttpError('Something went wrong' + error, 500));
    }
}



exports.postPasswordReset = async (req, res, next) => {
  const email = req.body.email;
  const resetToken = crypto.randomBytes(32).toString('hex');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(errors.array()[0].msg, 422));
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return next(new HttpError("No user found with this email.", 404));
    }

    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1hr
    await user.save();

    const msg = {
      to: email,
      from: 'productguide@teamlg.ca', // Verified sender
      subject: 'Password Reset',
      html: `
      <div> 
        <!-- Your HTML content here -->
        <a href="https://lgproductguide.ca/reset/${resetToken}">Reset Password</a>
      </div>`,
    };

    await sgMail.send(msg);
    console.log('Mail sent successfully');
    res.status(200).json({ message: 'Password reset email has been sent.' });

  } catch (err) {
    return next(new HttpError('Something went wrong - could not reset', 500));
  }
};
