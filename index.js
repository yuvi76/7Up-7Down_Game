require('./env');
require('./globals');
const { redis } = require('./app/utils');

const { mongodb } = require('./app/utils');
const router = require('./app/routers');
const socket = require('./app/sockets');

mongodb.initialize();
// redis.initialize();
router.initialize();
socket.initialize(router.httpServer);
