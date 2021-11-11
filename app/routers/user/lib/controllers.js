const { Player, Bid } = require('../../../models');
const controllers = {};

controllers.getbyPlayername = (req, res) => {
    try {
        Player.findOne({ sPlayername: req.params.sPlayername }, (err, player) => {
            if (err) return res.reply(messages.server_error());
            if (!player) return res.reply(messages.not_found('Player'));

            return res.reply(messages.no_prefix('Player Details'), player);
        });
    } catch (error) {
        console.log(error);
        return res.reply(messages.server_error());
    }
};

controllers.gameResult = (req, res) => {
    try {
        Player.updateOne({ _id: req.body.sPlayerId }, { $inc: { nCoin: req.body.nCoin } }, (err, player) => {
            if (err) return res.reply(messages.server_error());
            if (!player) return res.reply(messages.not_found('Player'));

            return res.reply(messages.no_prefix('Player Details'));
        });
    } catch (error) {
        console.log(error);
        return res.reply(messages.server_error());
    }
};

controllers.placeBid = (req, res) => {
    try {
        const bid = new Bid({
            sPlayerId: req.body.sPlayerId,
            sGameId: req.body.sGameId,
            nBidAmount: req.body.nBidAmount,
            eBidOption: req.body.eBidOption,
        });

        bid.save().then(() => {
            Player.updateOne({ _id: req.body.sPlayerId }, { $inc: { nCoin: -Number(req.body.nBidAmount) } }, (err, oResult) => {
                if (err) { console.log(err); return res.reply(messages.error()); }
                if (!oResult.n) return res.reply(messages.not_found('Player'));
                return res.reply(messages.updated("Player"));;
            });
        });
    } catch (error) {
        console.log(error);
        return res.reply(messages.server_error());
    }
};

module.exports = controllers;
