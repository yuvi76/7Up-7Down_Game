const controllers = {};

controllers.game = (req, res) => {
    return res.render('game.html')
};

module.exports = controllers;