const { Game } = require('../../../models');
const controllers = {};

controllers.create = async (req, res) => {
    try {
        const aGame = await Game.findOne({
            sGameId: req.body.sGameId,
        });
        console.log(aGame);

        const game = new Game({
            sGameId: req.body.sGameId,
            aPlayer: req.body.aPlayer
        });

        const newGame = await game.save();
        return res.reply(messages.successfully(), newGame);

    } catch (error) {
        console.log(error);
        return res.reply(messages.server_error());
    }
};
module.exports = controllers;
