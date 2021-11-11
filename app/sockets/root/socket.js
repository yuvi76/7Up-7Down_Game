const axios = require('axios');
const Socket = function () { };


let players = [];
let queue = [];
let matches = [];
let timerDuration = 18;

updateTimers();

Socket.prototype.init = function () {
    global.io.origins('*:*');

    // Connect Socket.io
    global.io.on("connection", (socketConnection) => {
        console.log("Socket.io connected");

        players.push({
            socket: socketConnection,
            bid: undefined,
            coinAmount: 0,
            userId: ''
        });

        socketConnection.on("disconnect", function () {
            playerDisconnected(socketConnection);
        });

        socketConnection.on("enter queue", function (userId) {
            enterQueue(socketConnection, userId);
        });

        socketConnection.on("leave queue", function () {
            leaveQueue(socketConnection);
        });

        socketConnection.on("place bid", function (bid, bidAmount) {
            updateBid(socketConnection, bid, bidAmount);
        });

        socketConnection.on("rematch", function () {
            rematch(socketConnection);
        });

    });
};

/**************  Functions  *************/
async function playerDisconnected(socket) {

    let player = await findPlayerById(socket.id);
    let index = players.indexOf(player);
    if (index > -1) {
        leaveQueue(socket);
        leaveMatch(socket);
        players.splice(index, 1);
    }
}

function findMatchBySocketId(socketId) {

    return new Promise(function (resolve, reject) {
        for (let i = 0; i < matches.length; i++) {
            for (let j = 0; j < matches[i].players.length; j++) {
                if (matches[i].players[j].socket.id === socketId) {
                    resolve(matches[i]);
                }
            }
        }
        reject(false);
    });
}

function findPlayerById(socketId) {
    return new Promise(function (resolve, reject) {
        for (let i = 0; i < players.length; i++) {
            if (players[i].socket.id === socketId) {
                resolve(players[i]);
            }
        }
        reject(false);
    });
}

async function enterQueue(socket, userId) {

    let player = await findPlayerById(socket.id);
    if (queue.indexOf(player) === -1) {
        queue.push(player);

        if (matches.length >= 1) {
            matches.forEach((data, index) => {
                console.log("aaaa", data);
                if (data.players.length > 0) {
                    let playerObject = {
                        socket: queue[index].socket,
                        bid: queue[index].bid,
                        coinAmount: queue[index].coinAmount,
                        userId
                    };

                    data.players.push(playerObject);
                    queue[index].socket.join(queue[index].socket.id);
                    queue.shift()
                }
            })
        } else {
            await createMatch([queue.shift()], userId);
        }
    }
}

async function leaveQueue(socket) {

    let player = await findPlayerById(socket.id);
    let index = queue.indexOf(player);
    if (index > -1) {
        queue.splice(index, 1);
    }
    socket.emit("queue left");
}

async function createMatch(participants, userId) {

    createId().then(async (id) => {
        let playerId = [];
        let match = {
            matchId: id,
            players: [],
            isOver: false,
            timerActive: false,
            timer: timerDuration
        };

        for (let i = 0; i < participants.length; i++) {
            let playerObject = {
                socket: participants[i].socket,
                bid: participants[i].bid,
                coinAmount: participants[i].coinAmount,
                userId: (userId === undefined ? participants[i].userId : userId)
            };
            playerId.push((userId === undefined ? participants[i].userId : userId))
            match.players.push(playerObject);
            participants[i].socket.join(id);
        }
        matches.push(match);

        await axios.post(`${process.env.URL}/api/v1/game/create`, {
            sGameId: match.matchId,
            aPlayer: playerId
        }).then(function (response) {
            console.log(response.data);
            io.to(id).emit("enter match", response.data.data._id);
            match.timerActive = true;
        }).catch(function (error) {
            console.log(error);
        })
    });
}

function createId() {
    return new Promise((resolve, reject) => {
        let id = "";
        let charset = "ABCDEFGHIJKLMNOPQRSTUCWXYZabcdefghijklmnopqrtsuvwxyz1234567890";
        for (let i = 0; i < 16; i++) {
            id += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        resolve(id);
    });
}

async function rematch(socket) {

    let match = await findMatchBySocketId(socket.id);
    console.log("match", match);
    if (match) {

        match.players.map((element) => {
            element.coinAmount = 0;
            element.bid = undefined;
            return element;
        });
        let players = match.players;
        removeMatch(match);
        createMatch(players);
    }
}

function updateBid(socket, bid, bidAmount) {

    for (let i = 0; i < matches.length; i++) {
        for (let j = 0; j < matches[i].players.length; j++) {
            if (matches[i].players[j].socket.id === socket.id) {
                matches[i].players[j].bid = bid;
                matches[i].players[j].coinAmount = Number(bidAmount);
            }
        }
    }
}

function playGame(match) {
    let dice1 = Math.floor(Math.random() * 6) + 1;
    let dice2 = Math.floor(Math.random() * 6) + 1;
    let diceFinalValue = dice1 + dice2;
    let bResult = false;
    console.log(diceFinalValue);

    match.players.forEach(async (player) => {
        if (player.bid === undefined) {
            return;
        }
        if (player.bid == '7U' && diceFinalValue > 7) {
            player.coinAmount = player.coinAmount * 2;
            bResult = true;
            console.log("******************* 7 UP ************");
        } else if (player.bid == '7D' && diceFinalValue < 7) {
            player.coinAmount = player.coinAmount * 2;
            bResult = true;
            console.log("****************** 7 Down ***********");
        } else if (player.bid == '7' && diceFinalValue == 7) {
            player.coinAmount = player.coinAmount * 4;
            bResult = true;
            console.log("xxxxxxxxxxxxxxxxxxxxxxxx 7 xxxxxxxxxxxxxxxxx");
        } else {
            player.coinAmount = player.coinAmount * 0;
            bResult = false;
            console.log("----------------------------------");
        }

        await axios.put(`${process.env.URL}/api/v1/user/gameResult`, {
            sPlayerId: player.userId,
            nCoin: player.coinAmount
        }).then(function (response) {
            io.to(match.matchId).emit("result", player.socket.id, bResult, player.coinAmount);
        }).catch(function (error) {
            console.log(error);
        })
    });

    setTimeout(() => {
        io.to(match.matchId).emit("rematch");
    }, 10000);

}

async function leaveMatch(socket) {

    let match = await findMatchBySocketId(socket.id);
    if (match) {
        match.players = match.players.filter(function (obj) {
            return obj.socket.id !== socket.id;
        });
        if (!match.isOver && match.players.length == 0) {
            endMatch(match, "player left");
            removeMatch(match);
        }
    }
}

async function endMatch(match, reason) {

    await io.to(match.matchId).emit("end match", reason);
    match.isOver = true;
    match.timer = timerDuration;
    match.timerActive = false;
}

function removeMatch(match) {

    let index = matches.indexOf(match);
    if (index > -1) {
        matches.splice(index, 1);
    }
}

function updateTimers() {

    for (let i = 0; i < matches.length; i++) {
        if (matches[i].timerActive) {
            matches[i].timer -= 1;
            console.log(matches[i].timer);
            if (matches[i].timer === 0) {
                timesup(matches[i]);
            }
            io.sockets.emit('timer', { bidTime: matches[i].timer });
        }
    }
    setTimeout(updateTimers, 1000);
}

function timesup(match) {

    match.timerActive = false;
    match.timer = timerDuration;
    playGame(match);
}

module.exports = new Socket();