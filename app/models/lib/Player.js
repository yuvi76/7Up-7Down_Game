const mongoose = require('mongoose');

const PlayerSchema = mongoose.Schema({
    sPlayername: {
        type: String,
        required: true
    },
    sPlayerID: String,
    nCoin: Number,
},
    { timestamps: true }
);

module.exports = mongoose.model('Player', PlayerSchema);