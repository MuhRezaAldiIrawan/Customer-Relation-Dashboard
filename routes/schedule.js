var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const knex = require('../database');
const schedule = require('node-schedule');
const date = new Date(2022, 02, 05, 10, 15, 0);
/* GET users listing. */
router.get('/',Auth_mdw.check_login, function(req, res, next) {
    const job = schedule.scheduleJob(date, function(){
        console.log('The world is going to end today.');
    });
});



module.exports = router;
