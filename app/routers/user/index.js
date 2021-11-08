const router = require('express').Router();
const userController = require('./lib/controllers');

router.get('/:sPlayername', userController.getbyPlayername);
router.put('/gameResult/:sPlayername', userController.gameResult);
router.put('/placeBid/:sPlayername', userController.placeBid);

module.exports = router;
