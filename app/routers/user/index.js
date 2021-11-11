const router = require('express').Router();
const userController = require('./lib/controllers');

router.get('/:sPlayername', userController.getbyPlayername);
router.put('/gameResult', userController.gameResult);
router.put('/placeBid', userController.placeBid);

module.exports = router;
