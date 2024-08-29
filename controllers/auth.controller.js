const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const UserModel = require('../models/user.model');


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
console.log(req.body)
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

        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        store: store,
        password: hashedPassword,
    });

    try {
        await user.save();
    } catch (err) {
        return next(new HttpError('Saving user failed, please try again later.', 500));
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

    // res.status(201).json({ message: 'New user added.', });
};