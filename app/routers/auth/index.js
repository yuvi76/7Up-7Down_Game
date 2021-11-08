const router = require('express').Router();
const authController = require('./lib/controllers');

router.post('/login', authController.login);
module.exports = router;
