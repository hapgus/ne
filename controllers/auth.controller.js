const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const UserModel = require('../models/user.model');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEYS);  

exports.postSignin = (req, res, next) => {
  const {email, password} = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(errors.array()[0].msg, 422));
  }

  let loadedUser;
  let passwordCorrect;
  let token;

   UserModel.findOne({ email: email })

    .then(user => {
      if (!user) {
        return next(new HttpError('Email or password is incorrect.', 401));
      }

      if (user.status !== "approved") {
        return next(new HttpError('Access denied! User is not approved.', 410))
      }
      loadedUser = user;
   
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      passwordCorrect = isEqual;
      if (!passwordCorrect) {
        return next(new HttpError('Invalid credentials. Please try again with a different user name or password.', 401));
      } else {
        // Proceed only if the password is correct
        token = jwt.sign({
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
          role: loadedUser.role,
          status:loadedUser.status,
          firstName:loadedUser.firstName,
          lastName:loadedUser.lastName
        },
          process.env.JWT_SECRET,
          { expiresIn: "1h" });

        return loadedUser.save();
      }
    })
    .then(() => {
      if (token) { // Only send the success response if a token was set
        res.status(202).json({
          token: token,
          message: 'success'
        });
      }
    })
    // .catch(error => console.error('error in post sign-in controller', error));
    .catch(error => {
      // Log the error for debugging purposes
      console.error('Error in post sign-in controller:', error);

      // Check if the error is a custom HttpError
      if (error instanceof HttpError) {
        return next(error);
      }

      // Handle MongooseServerSelectionError specifically
      if (error.name === 'MongooseServerSelectionError') {
        return next(new HttpError('Database connection error. Please try again later.', 503));
      }

      return next(new HttpError('An unexpected error occurred.', 500));
    });
}


exports.postSignup = async (req, res, next) => {
  const { firstName, lastName, email, password, store } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError(errors.array()[0].msg, 422));
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError('Password hashing failed, please try again later.', 500));
  }

  const user = new UserModel({
    firstName,
    lastName,
    email: email.toLowerCase(),
    store,
    password: hashedPassword,
  });

  try {
    await user.save();
  } catch (err) {
    return next(new HttpError('Saving user failed, please try again later.', 500));
  }

  // Now send the confirmation email using SendGrid
  const msg = {
    to: email,
    from: 'productguide@teamlg.ca',  // Your verified sender email
    subject: 'Sign up confirmation',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Signup Request Confirmation</title>
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
                        style="font-size: 24px; color: #262626; margin-bottom: 20px;"
                      >
                        Signup Request Confirmation
                      </h1>
                      <p
                        style="font-size: 16px; color: #4A4946; line-height: 1.6; margin-bottom: 20px;"
                      >
                        Your account registration is being processed, and once
                        approved, you will receive a notification.
                      </p>
                      <p
                        style="font-size: 16px; color: #4A4946; line-height: 1.6; margin-bottom: 20px;"
                      >
                        If you have any questions, please reach out to our support
                        team at <a href="mailto:lgproductguide@gmail.com">lgproductguide@gmail.com</a>.
                      </p>
                      <p style="font-size: 16px; color: #4A4946;">
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
                      <p style="font-size: 12px; color: #716F6A;">
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
    await sgMail.send(msg);  // Send the email
    console.log('Signup confirmation email sent successfully.');
  } catch (err) {
    console.error('Error sending email:', err);
    return next(new HttpError('Sending confirmation email failed.', 500));
  }

  let token;

  try {
    token = jwt.sign({ userId: user._id, userEmail: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  } catch (err) {
    return next(new HttpError('Creating a token failed, please try again later.', 500));
  }

  res.status(201).json({
    message: 'New user added.',
    token: token,
    userId: user._id,
    userEmail: user.email,
  });
};

exports.postPasswordReset = async (req, res, next) => {
  const email = req.body.email;
 
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError(errors.array()[0].msg, 422));
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return next(new HttpError("No user found with this email.", 404));
    }
    const resetToken = crypto.randomBytes(32).toString('hex'); // Generate reset token
    // Store token and expiration in user record
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Send password reset email using SendGrid
    const msg = {
      to: email,
      from: 'productguide@teamlg.ca',  // Your verified sender email
      subject: 'Password Reset',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Password Reset</title>
          </head>
          <body
            style="font-family: Arial, sans-serif; background-color: whitesmoke; margin: 0; padding: 0;"
          >
            <table
              role="presentation"
              cellspacing="0"
              cellpadding="0"
              border="0"
              width="100%"
              style="max-width: 600px; margin: 0 auto; background-color: whitesmoke;"
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
                        <h1 style="font-size: 24px; color: #716f6a; margin-bottom: 20px;">
                          Password Reset
                        </h1>
                        <p style="font-size: 16px; color: #716f6a; line-height: 1.6;">
                          You recently requested a password reset for your LG Product Guide account. To reset your password, follow these steps:
                        </p>
                        <ol style="font-size: 16px; color: #716f6a; line-height: 1.6;">
                          <li>
                            Click on the link below or copy and paste it into your browser: <br />
                            <a href="https://lgproductguide.ca/reset/${resetToken}">
                              https://lgproductguide.ca/reset/${resetToken}
                            </a>
                          </li>
                          <li>You'll be directed to a secure page to set a new password.</li>
                          <li>Enter and confirm your new password.</li>
                          <li>Click "Reset Password" to complete the process.</li>
                        </ol>
                        <div style="text-align: center; margin-top: 20px;">
                          <a href="https://lgproductguide.ca/reset/${resetToken}"
                            style="display: inline-block; background-color: #fd312e; color: #ffffff; padding: 15px 20px; font-size: 16px; text-decoration: none; border-radius: 30px;">
                            Reset Password
                          </a>
                        </div>
                        <p style="font-size: 16px; color: #716f6a; line-height: 1.6; margin-top: 20px;">
                          If you have any questions, please reach out to our support team at <a href="mailto:lgproductguide@gmail.com">lgproductguide@gmail.com</a>.
                        </p>
                        <p style="font-size: 16px; color: #716f6a;">Thank you,<br>LG Training Team</p>
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

    await sgMail.send(msg);
    console.log('Password reset email sent successfully.');
    res.status(200).json({ message: 'Password reset email has been sent.' });

  } catch (err) {
    console.error('Error sending email:', err);
    return next(new HttpError('Something went wrong - could not reset', 500));
  }
};

// exports.postPasswordReset = async (req, res, next) => {
//   const email = req.body.email;
//   const resetToken = crypto.randomBytes(32).toString('hex');
//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return next(new HttpError(errors.array()[0].msg, 422));
    
//   }

//   try {
//     const user = await UserModel.findOne({ email: email });
//     if (!user) {

//       return next(new HttpError("No user found with this email.", 404));
//       // return res.status(404).json({ message: 'No user found with this email.' });
//     }

//     user.resetToken = resetToken;
//     user.resetTokenExpiration = Date.now() + 3600000; // 1hr in milliseconds

//     await user.save();

//     await transporter.sendMail({
//       to: req.body.email,
//       from: 'productguide@teamlg.ca',
//       subject: 'Password Reset',
//       html:
//         `<div
//               style="font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; background-color: whitesmoke; display: flex; flex-direction: column; align-items: flex-start; border-radius:16px;">
  
//               <div
//                   style="height: inherit; background-color: white; padding:25px;  border-radius:16px; ">
//               <div styles="display: flex; align-items: center;">
//                   <div style="height: auto; width:150px; display: flex; justify-content: center;">
//                       <img src="${process.env.LOGO_IMAGE_PATH}"
//                           style="height: 100%;  display:flex; width: 100%; object-fit: contain;" />
//                   </div>
//               </div>
//                   <div style="padding: 5px 0 10px 0;">
//                       <div>
                         
//                           <h1 style="font-size: 24px; color: #716F6A; margin-bottom: 20px;">
//                               Password Reset
//                           </h1>
//                       </div>
//                       <div style="display: flex; flex-direction: column; row-gap: 10px; ">
//                           <p style="font-size: 18px; color: #716F6A; line-height: 1.7;">
//                               You recently requested a password reset for your LG Product Guide account. To proceed with resetting
//                               your password, please follow these simple steps:
//                               <!-- Your account registration is currently being processed, and once approved, you will receive an email notification. This email will confirm that your account is active and ready for you to dive into the full potential of our Product Guide.  If you have any questions or need assistance, please don't hesitate to reach out to our support team at lgproductguide@gmail.com. We're here to help! -->
//                           </p>
//                           <ol style="font-size: 18px; color: #716F6A; line-height: 1.7;">
//                               <li>Click on the button below or this link: <br>
//                               <a href="https://lgproductguide.ca/reset/${resetToken}">
//           <p>https://lgproductguide.ca/reset/${resetToken}</p>
//                                   </a>
//                               </li>
//                               <li>You will be directed to a secure page to set a new password.</li>
//                               <li>Enter your new password and confirm it.</li>
//                               <li>Click "Reset Password" to complete the process.</li>
//                           </ol>
//                           <div>
//                           <a href="https://lgproductguide.ca/reset/${resetToken}"
//                                   style="display: inline-block; background-color: #FD312E; color: #ffffff; padding: 20px; font-size: 16px; text-decoration: none; border-radius: 30px; margin: 20px 0;">
//                                   Reset Password
//                               </a>
//                           </div>
//                           <p style="font-size: 18px; color: #716F6A; line-height: 1.7;">
//                               If you have any questions or need assistance, please don't hesitate to reach out to our support team
//                               at lgproductguide@gmail.com. We're here to help!
//                           </p>
//                       </div>
//                       <div>
//                           <p style="font-size: 18px; color: #716F6A">Thank you,</p>
//                           <p style="font-size: 18px; color: #716F6A; padding-top: 15px;">LG Training Team</p>
//                       </div>
//                   </div>
//                   <div style="border-top: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px;
//                           border-bottom: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px; margin-bottom: 10px;">
//                       <p style="font-size: 14px; color:#D0CBC1;">This message was sent from LG Home Appliances Product Guide.</p>
//                   </div>
//                   <div style="padding: 5px 0 10px 0;">
//                       <div>
                          
//                           <h1 style="font-size: 24px; color: #716F6A; margin-bottom: 20px;">
//                               Réinitialisation du mot de passe
//                           </h1>
//                       </div>
//                       <div style="display: flex; flex-direction: column; row-gap: 10px; ">
//                           <p style="font-size: 18px; color: #716F6A; line-height: 1.7;">
//                               Vous avez récemment demandé une réinitialisation du mot de passe pour votre compte LG Product Guide.
//                               Pour procéder à la réinitialisation
//                               votre mot de passe, veuillez suivre ces étapes simples :
//                           </p>
//                           <ol style="font-size: 18px; color: #716F6A; line-height: 1.7;">
//                               <li>Click on the button below or this link: <br>
//                               <a href="https://lgproductguide.ca/reset/${resetToken}">${resetToken}
          
//                                   </a>
//                               </li>
//                               <li>You will be directed to a secure page to set a new password.</li>
//                               <li>Enter your new password and confirm it.</li>
//                               <li>Click "Reset Password" to complete the process.</li>
//                           </ol>
//                           <div>
//                               <a href="https://lgproductguide.ca/reset/${resetToken}"
//                                   style="display: inline-block; background-color: #FD312E; color: #ffffff; padding: 20px; font-size: 16px; text-decoration: none; border-radius: 30px; margin: 20px 0;">
//                                   Reset Password
//                               </a>
//                           </div>
//                           <p style="font-size: 18px; color: #716F6A; line-height: 1.7;">
//                               Si vous avez des questions ou avez besoin d'aide, n'hésitez pas à contacter notre équipe
//                               d'assistance
//                               à lgproductguide@gmail.com. Nous sommes là pour vous aider !
//                           </p>
//                       </div>
//                       <div>
//                           <p style="font-size: 18px; color: #716F6A">Merci,</p>
//                           <p style="font-size: 18px; color: #716F6A; padding-top: 15px;">Équipe de formation LG</p>
//                       </div>
//                   </div>
//                   <div style="border-top: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px;
//                           border-bottom: 1px solid #D0CBC1; padding-top: 5px; margin-top: 5px; margin-bottom: 10px;">
//                       <p style="font-size: 14px; color:#D0CBC1;">Ce message a été envoyé à partir du Guide des produits LG Home
//                           Appliances.</p>
//                   </div>
//               </div>
          
//           </div>`
//     });
//     console.log('Mail sent successfully');
//     res.status(200).json({ message: 'Password reset email has been sent.' });
//   } catch (err) {
//     return next(new HttpError('Something went wrong - could not reset', 500));
//   }
// };
 
//     const { firstName, lastName, email, password, store } = req.body;
// console.log(req.body)
//     const errors = validationResult(req);

//  if (!errors.isEmpty()) {
//         return next(new HttpError(errors.array()[0].msg, 422));
//     }

//     let hashedPassword;

//     try {
//         hashedPassword = await bcrypt.hash(password, 12);
//     } catch (err) {
//         return next(new HttpError('Password hashing failed, please try again later.', 500));
//     }

//     const user = new UserModel({

//         firstName: firstName,
//         lastName: lastName,
//         email: email.toLowerCase(),
//         store: store,
//         password: hashedPassword,
//     });

//     try {
//         await user.save();
//     } catch (err) {
//         return next(new HttpError('Saving user failed, please try again later.', 500));
//     }
  
//     let token;

//     try {
//         token = jwt.sign({ userId: user._id, userEmail: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     } catch (err) {
//         return next(new HttpError('Creating a token failed, please try again later.', 500));
//     }

//     res.status(201).json({
//       message: 'New user added.',
//       token: token,
//       userId: user._id,
//       userEmail: user.email,
//     });

//     // res.status(201).json({ message: 'New user added.', });
// };