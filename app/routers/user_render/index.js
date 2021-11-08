const router = require('express').Router();
const userRenderController = require('./lib/controllers');

/********** Commond File Render **************/
router.get('/', userRenderController.game);

module.exports = router;