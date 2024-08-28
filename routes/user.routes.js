//--------------------------------
//-------PRIVATE:USER ROUTES
//--------------------------------
//-------LOCAL IMPORTS
const express = require('express');
const Auth = require('../middleware/auth');
const router = express.Router();
const userController = require("../controllers/user.controller");


//AUTHENTICATION MIDDLEWARE

// router.use(auth);
//-------CREATE-------//
router.post('/save-list/:userId', userController.postList);


//-------READ---------------------//
// router.get('/user-profile/:userId', Auth, userController.getUser);
// router.get('/user-profile/:userId', Auth, userController.getUserProfile);
router.get('/user-profile/:userId', userController.getUserProfile);
router.get('/user-lists/:userId',   userController.getUserSavedLists);
router.get('/user-list/:listId',   userController.getUserSavedList);
// router.get('/user-list/:listId',  Auth, userController.getSavedListsToEdit);

//-------UPDATE-------//
// router.patch('/edit-list/:listId', Auth,  userController.patchEditList);
// router.patch('/edit-profile/:userId', Auth, userController.patchEditUser);
router.patch('/edit-profile/:userId', userController.patchEditUser);


//-------DELETE-------//
router.delete('/delete-list/:listId', userController.deleteList);
// router.delete('/delete-user/:userId', Auth, userController.deleteUser)


//-------GLOBAL EXPORT
module.exports = router;