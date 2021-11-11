const router = require('express').Router();

const authRoute = require('./auth');
const userRoute = require('./user');
const gameRoute = require('./game');

router.use('/auth', authRoute);
router.use('/user', userRoute);
router.use('/game', gameRoute);

module.exports = router;
