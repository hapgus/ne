const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema(
    {
        availability: { type: String, required: false },
        category: { type: String, required: false },
        colors: { type: Array, required: false },
        image: { type: String, required: false },
        qrcode:{ type: String, required: false },
        logos: { type: Array, required: false },
        msrp: { type: Number, required: false },
        specList1: { type: Array, required: false },
        specList2: { type: Array, required: false },
        specList3: { type: Array, required: false },
        specList4: { type: Array, required: false },
        specTitle1: { type: String, required: false },
        specTitle2: { type: String, required: false },
        specTitle3: { type: String, required: false },
        specTitle4: { type: String, required: false },
        specSheetLink: { type: String, required: false },
        specSheetQrcode: { type: String, required: false },
        store: { type: String, required: false },
        stylecategory: { type: String, required: false },
        subcategory: { type: String, required: false },
        subtitle: { type: String, required: false },
        title: { type: String, required: false },
        upc: { type: Array, required: false },
        videos: { type: Array, required: false },
        sections:[{
            resourceTitle:{ type: String, required: false },
            resourceUrl:{ type: String, required: false },
            resourceQrCodeImage:{ type: String, required: false },
            // resourceQrCodeImage:{ type: Array, required: false },
        }],

        creator: { type: Schema.Types.ObjectId, ref: 'User', required: false},
    },
    { timestamps: true }

);

module.exports = mongoose.model('LGProductCollections', productSchema);




