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
        });

        socketConnection.on("disconnect", function () {
            playerDisconnected(socketConnection);
        });

        socketConnection.on("enter queue", function () {
            enterQueue(socketConnection);
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
function playerDisconnected(socket) {

    let player = findPlayerById(socket.id);
    let index = players.indexOf(player);
    if (index > -1) {
        leaveQueue(socket);
        leaveMatch(socket);
        players.splice(index, 1);
    }
}

function findMatchBySocketId(socketId) {

    for (let i = 0; i < matches.length; i++) {
        for (let j = 0; j < matches[i].players.length; j++) {
            if (matches[i].players[j].socket.id === socketId) {
                return matches[i];
            }
        }
    }
    return false;
}

function findPlayerById(socketId) {

    for (let i = 0; i < players.length; i++) {
        if (players[i].socket.id === socketId) {
            return players[i];
        }
    }
    return false;
}

function enterQueue(socket) {

    let player = findPlayerById(socket.id);
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
                    };

                    data.players.push(playerObject);
                    queue[index].socket.join(queue[index].socket.id);
                    queue.shift()
                }
            })
        } else {
            createMatch([queue.shift()]);
        }
    }
}

function leaveQueue(socket) {

    let player = findPlayerById(socket.id);
    let index = queue.indexOf(player);
    if (index > -1) {
        queue.splice(index, 1);
    }
    socket.emit("queue left");
}

function createMatch(participants) {

    let id = createId();
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
        };
        match.players.push(playerObject);
        participants[i].socket.join(id);
    }
    matches.push(match);

    io.to(id).emit("enter match");
    match.timerActive = true;
}

function createId() {

    let id = "";
    let charset = "ABCDEFGHIJKLMNOPQRSTUCWXYZabcdefghijklmnopqrtsuvwxyz1234567890";
    for (let i = 0; i < 16; i++) {
        id += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return id;
}

function rematch(socket) {

    let match = findMatchBySocketId(socket.id);
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

    console.log(diceFinalValue);

    match.players.forEach(player => {
        if (player.bid === undefined) {
            return;
        }
        if (player.bid == '7U' && diceFinalValue > 7) {
            player.coinAmount = player.coinAmount * 2;
            console.log("******************* 7 UP ************");
        } else if (player.bid == '7D' && diceFinalValue < 7) {
            player.coinAmount = player.coinAmount * 2;
            console.log("****************** 7 Down ***********");
        } else if (player.bid == '7' && diceFinalValue == 7) {
            player.coinAmount = player.coinAmount * 4;
            console.log("xxxxxxxxxxxxxxxxxxxxxxxx 7 xxxxxxxxxxxxxxxxx");
        } else {
            player.coinAmount = player.coinAmount * 0;
            console.log("----------------------------------");
        }
        io.to(match.matchId).emit("result", player.coinAmount, player.socket.id);
    });

    setTimeout(() => {
        io.to(match.matchId).emit("rematch");
    }, 10000);

}

function leaveMatch(socket) {

    let match = findMatchBySocketId(socket.id);
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

function endMatch(match, reason) {

    io.to(match.matchId).emit("end match", reason);
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
