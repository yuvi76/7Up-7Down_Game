const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({
    aPlayer: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Player'
    }],
    sGameId: {
        type: String,
        unique: true
    }
},
    { timestamps: true }
);

module.exports = mongoose.model('Game', GameSchema);
