const mongoose = require('mongoose');

const BidSchema = mongoose.Schema({
    sPlayerID: {
        type: mongoose.Schema.ObjectId,
        ref: 'Player'
    },
    sGameId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Game'
    },
    nBidAmount: Number,
    eBidOption: {
        type: String,
        enum: ["7", "7U", "7D"]
    }
},
    { timestamps: true }
);

module.exports = mongoose.model('Bid', BidSchema);
