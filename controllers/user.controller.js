//--------------------------------
//-------PRIVATE: USER CONTROLLER
//--------------------------------
const UserModel = require('../models/user.model');
const HttpError = require('../models/http-error');
const SavedListModel = require('../models/saved-lists.model');
const ProductModel = require('../models/product.model')


//-------CREATE-------//
exports.postList = async (req, res, next) => {

    const { listName, listNotes, list: builderList } = req.body;
    const userId = req.params.userId;

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return next(new HttpError("User not found.", 404));
        }
        // Ensure builderList is an array and has elements
        if (!Array.isArray(builderList) || builderList.length === 0) {
            return next(new HttpError("Builder list is empty or not properly formatted.", 400));
        }
        const listToSave = builderList;

        if (!listToSave) {
            return next(new HttpError("Could not save the list in it's current form.", 404));
        }

        const savedList = new SavedListModel({

            builderList: listToSave,
            listName,
            listNotes,
            userId: userId,
        })
        await savedList.save();
        // Update the user's saved lists
        user.savedLists.push(savedList._id);
        await user.save();

        res.status(201).json({
            message: 'List saved successfully',
            list: savedList
        });
    } catch (err) {
        console.error(err);
        return next(new HttpError('Saving list failed: ' + err.message, 500));
    }

};

// exports.postList = async (req, res, next) => {
//     const { listName, listNotes, list: builderList } = req.body;
//     const userId = req.params.userId;

//     try {
//         // Validate user
//         const user = await UserModel.findById(userId);
//         if (!user) {
//             return next(new HttpError("User not found.", 404));
//         }

//         // Ensure builderList is an array and has elements
//         if (!Array.isArray(builderList) || builderList.length === 0) {
//             return next(new HttpError("Builder list is empty or not properly formatted.", 400));
//         }

//         // Fetch product titles and prepare listToSave
//         const listToSave = await Promise.all(
//             builderList.map(async (item) => {
//                 const product = await ProductModel.findById(item.product); // Replace 'ProductModel' with your actual model name
//                 if (!product) {
//                     throw new Error(`Product with ID ${item.product} not found.`);
//                 }
//                 return {
//                     product: product._id,
//                     title: product.title,
//                 };
//             })
//         );

//         const savedList = new SavedListModel({
//             builderList: listToSave,
//             listName,
//             listNotes,
//             userId,
//         });

//         await savedList.save();

//         // Update the user's saved lists
//         user.savedLists.push(savedList._id);
//         await user.save();

//         res.status(201).json({
//             message: 'List saved successfully',
//             list: savedList
//         });
//     } catch (err) {
//         console.error(err);
//         return next(new HttpError('Saving list failed: ' + err.message, 500));
//     }
// };
exports.getUserProfile = async (req, res, next) => {

    const userId = req.params.userId;
    try {

        const user = await UserModel.findById(userId);
        if (!user) {

            return next(new HttpError("User not found.", 404))
        }
        if (user._id.toString() !== userId) {

            return next(new HttpError("Access denied.", 403))
        }

        const userResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            store: user.store,
            address: user.address,
            email: user.email,
            joined: user.createdAt,
            lastUpdated: user.updatedAt,
        }
        if (!userResponse) {
            return next(new HttpError("Something is wrong with the account information.", 404))
        }

        res.status(200).json({
            message: 'THE User fetched! - server',
            user: userResponse
        });
    } catch (err) {
        return next(new HttpError("Something went wrong.", 500))
    }
}


exports.getUserSavedLists = async (req, res, next) => {

    const userId = req.params.userId;
    console.log(userId)

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new HttpError('User could not be found.', 404));
        }

        const savedLists = await SavedListModel.find({ userId: userId });
        console.log('s',savedLists)

        if (!savedLists) {
            return next(new HttpError('User lists not found.', 404));
        }
console.log('saved list',savedLists)
        const listsToSend = savedLists.map((savedList) => ({
            list: savedList.builderList,  // builderList is directly accessible here
            listName: savedList.listName,
            listNotes: savedList.listNotes,
            lastUpdated: savedList.updatedAt,
            productCount: savedList.builderList.length,
            listId:savedList._id
        }));
        console.log(' list',listsToSend)

        res.status(200).json({
            userLists: listsToSend,
            // user: userInfo,
            // message: "User lists found",
        });
    } catch (err) {
        next(err);
    }
};

exports.getUserSavedList = async (req, res, next) => {

    const { listId } = req.params;

    try {
        // Check if the user exists
        // const user = await UserModel.findById(userId);
        // if (!user) {
        //     return next(new HttpError('User could not be found.', 404));
        // }

        // Find the specific saved list by its ID
        const savedList = await SavedListModel.findOne({ _id: listId });

        if (!savedList) {
            return next(new HttpError('Saved list not found.', 404));
        }

        // Construct the list to send
        const listToSend = {
            list: savedList.builderList,
            listName: savedList.listName,
            listNotes: savedList.listNotes,
            lastUpdated: savedList.updatedAt,
            productCount: savedList.builderList.length,
            listId: savedList._id
        };

        // Send the list to the frontend
        res.status(200).json({
            savedList: listToSend,
        });

    } catch (err) {
        console.error(err);
        return next(new HttpError('Fetching saved list failed.', 500));
    }
};


exports.getSavedListsToEdit = async (req, res, next) => {

    const listId = req.params.listId;
    try {
        const savedList = await SavedListModel.findById(listId);

        if (!savedList) {
            return next(new HttpError('No list by that ID.', 404))
        }

        const user = await UserModel.findOne({ _id: savedList.userId });

        if (!user) {
            return next(new HttpError('No user found for thid list.', 404))
        }
        const userInfo = {
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
            store: user.store
        };

        res.status(200).json({
            userLists: savedList,
            user: userInfo,
        })
    } catch (err) {

        next(err);
    }
};


exports.patchEditList = async (req, res, next) => {

    const listId = req.params.listId;
    let updatedList;
    try {
        updatedList = await SavedListModel.findById(listId)

        if (!updatedList) {
            // return res.status(404).json({
            //     message: 'List not found'
            // });
            return next(new HttpError('We cannot find your list.', 404))
        }

    } catch (err) {
        return next(new HttpError('Something went wrong.', 500))
        // const error = new HttpError(
        //     'Something went wrong could not update the user - server', 500
        // );
        // return next(error);
    }
    const builderList = req.body.builderList;
    const { listName, listEmail, listNotes, listPrice } = req.body;

    updatedList.listName = listName;
    updatedList.listEmail = listEmail;
    updatedList.listNotes = listNotes;
    updatedList.listPrice = listPrice;
    updatedList.builderList = builderList;

    try {
        await updatedList.save()
    } catch (err) {
        return next(new HttpError('We could not save your list.', 500))
        // const error = new HttpError(
        //     'Something went wrong could not save the updated list - server', 500
        // );
        // return next(error);
    }
    res.status(200).json({
        message: "User list",
        updatedList: updatedList
    })
};

exports.patchEditUser = async (req, res, next) => {
    const userId = req.params.userId;
    let userProfile;
    try {
        userProfile = await UserModel.findById(userId)
        if (!userProfile) {
            return next(new HttpError('User account not found.', 404))
        }

    } catch (err) {
        return next(new HttpError('Something went wrong. The account was not updated. Please contact an administrator.', 400))
    }
    const { firstName, lastName, store, address } = req.body;

    userProfile.firstName = firstName;
    userProfile.lastName = lastName;
    userProfile.store = store;
    userProfile.address = address;

    try {
        await userProfile.save()
    } catch (err) {
        return next(new HttpError('Something went wrong. The updates could not be saved. Please contact an administrator.', 400))
    }

    const user = {
        _id: userProfile._id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        store: userProfile.store,
        address: userProfile.address,
        // sessionData: userProfile.sessionData,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
    }
    res.status(201).json({
        message: "User updated",
        user: user
    })
}

//-------DELETE-------//

exports.deleteList = async (req, res, next) => {

    const listId = req.params.listId;
    console.log(listId)
    let listToDelete;
    try {
        listToDelete = await SavedListModel.findById(listId);
        console.log(listToDelete)
        if (!listToDelete) {
            return res.status(404).json({ message: 'Saved list not found' });
        }
        await listToDelete.remove();

        // Delete the reference from the user's savedLists
        await UserModel.findByIdAndUpdate(listToDelete.userId, {
            $pull: { savedLists: listId },
        });

    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not delete the saved list', 500
        );
        return next(error);
    }
    res.status(200).json({
        message: "Saved list deleted!"
    });
    console.log({
        listId,
        listToDelete
    })
};

// exports.deleteUser = async (req, res, next) => {
//     const userId = req.params.userId;
//     let userToDelete;
//     try {
//         userToDelete = await UserModel.findById(userId)
//         if (!userToDelete) {
//             return next(new HttpError('User account not found.', 404))
//         }
//         if (userId !== userToDelete._id.toString()) {
//             // console.log("uid", userId, "ud-uid", userToDelete._id)
//             return next(new HttpError('User account error.', 404))
//         }
//     } catch (err) {
//         return next(new HttpError('Something went wrong. The account was not updated. Please contact an administrator.', 400))
//     }
//     try {
//         await userToDelete.remove();
//     } catch (err) {
//         return next(new HttpError('Something went wrong. The account was not deleted. Please contact an administrator.', 500))
//     }
//     res.status(201).json({
//         message: "User deleted!"
//     })
// }