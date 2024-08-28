
// const DirectoryModel = require('../models/Directory/directory.model');
const HttpError = require('../models/http-error');
const ProductModel = require('../models/product.model');

exports.getProducts = async (req, res, next) => {
    try {
        const product = await ProductModel.find()
       
        if (!product) {
            return next(new HttpError('Contact the administrator', 404))
        }
        console.log('product sent')
        return res.status(200).json({
            allProducts: product,
            message: 'All products - server'
        })
    } catch (err) {
        return next(new HttpError('Something went wrong', 500))
    }
};

exports.getProduct = async (req, res, next) => {
    const productId = req.params.productId;
    try {
        const product = await ProductModel.findById(productId)
        console.log('product fetched')
        if (!product) {
            return next(new HttpError('Product not found.', 404))
        }
        console.log('product sent')
        return res.status(200).json({
            product: product,
            message: 'The product delivered - server'
        })
    } catch (err) {
        return next(new HttpError('Something went wrong', 500))
    }
};