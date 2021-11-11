const router = require('express').Router();
const userController = require('./lib/controllers');

router.post('/create', userController.create);

module.exports = router;
