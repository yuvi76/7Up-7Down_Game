const { Player } = require('../../../models');
const controllers = {};
controllers.login = (req, res) => {
    try {
        Player.findOne({ sPlayername: req.body.sPlayername }, (err, user) => {
            if (err) return res.reply(messages.error());
            if (!user) return res.reply(messages.not_found('User'));
            return res.reply(messages.successfully('User Login'), { auth: true, user });
        })
    } catch (error) {
        console.log(error);
        return res.reply(messages.server_error());
    }
}
module.exports = controllers;
