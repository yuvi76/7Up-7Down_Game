const socketIO = require('socket.io');
const root = require('./root/socket');

function Socket() {
    this.options = {
        pingInterval: 30000,
        pingTimeout: 15000,
        cookie: false,
        maxHttpBufferSize: 1024,
        serveClient: true,
        transports: ['polling', 'websocket'],
        allowUpgrades: true,
        perMessageDeflate: false,
    };
}

Socket.prototype.initialize = function (httpServer) {
    log.green('Socket initialized');
    global.io = socketIO(httpServer, this.options);
    root.init();
};

module.exports = new Socket();
