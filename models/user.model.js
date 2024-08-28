const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false, },
        status: { type: String, default: 'pending', required: false },
        role: { type: String, default: 'user', required: false },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        email: { type: String, required: false },
        store: { type: String, required: false },
        address: { type: String, required: false },
        // address: { type: String, required: false },
        password: { type: String, required: false },
        lastLoggedIn: { type: Date, required: false },
        resetToken: String,
        resetTokenExpiration: Date,
        savedLists: [{ type: Schema.Types.ObjectId, ref: "Saved List", required: false }],
        productsCreated: [{
            product: { type: Schema.Types.ObjectId, ref: 'LGProductCollection', required: false },
            createdAt: { type: Date, required: false },
            productName: { type: String, required: false }
        }],
        productsUpdated: [{
            product: { type: Schema.Types.ObjectId, ref: 'LGProductCollection' },
            updatedAt: { type: Date, default: Date.now },
            productName: { type: String }
        }],
        usersCreated: [{
            user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
            name: { type: String, ref: 'User', required: false },
            email: { type: String, ref: 'User', required: false }
            
        }],
        productsDeleted: [{
            product: { type: Schema.Types.ObjectId, ref: 'LGProductCollection' },
            deletedOn: { type: Date, default: Date.now },
            productName: { type: String, required: false }
        }],
        usersUpdated: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            name: {  type: String, ref: 'User', required: false },
            updatedOn: { type: Date, default: Date.now }
        }],
        usersDeleted: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            name: { type: String, ref: 'User', required: false },
            email: { type: String, ref: 'User', required: false },
            deletedOn: { type: Date, default: Date.now }

        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);