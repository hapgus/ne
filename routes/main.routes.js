const express = require('express');

const mainController = require("../controllers/main.controller");
const router = express.Router();

// router.get('/', mainController.getHome);

router.get('/products', mainController.getProducts);
router.get('/product/:productId', mainController.getProduct);
// router.get('/page/:pageId', mainController.getPage);

//-------GLOBAL EXPORT
module.exports = router;