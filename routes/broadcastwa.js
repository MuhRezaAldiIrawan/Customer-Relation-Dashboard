var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const knex = require('../database');

/* GET users listing. */
router.get('/',Auth_mdw.check_login, function(req, res, next) {
    return res.render('backend/broadcastwa',{
        success: req.flash("success"),
        errors: req.flash("errors")
    });
});

module.exports = router;