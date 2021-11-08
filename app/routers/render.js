const router = require('express').Router();

const userRenderRoute = require('./user_render');

router.use('/', userRenderRoute);

module.exports = router;