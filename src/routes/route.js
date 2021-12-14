const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController')




// url Routes
router.post('/url/shorten', urlController.urlShortener);
router.get('/:urlCode', urlController.getUrl);


module.exports = router;