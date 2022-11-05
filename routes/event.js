var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
var knex = require('../database');
const { Validator } = require('node-input-validator');
var nodemailer  = require('nodemailer');
var bcrypt = require('bcrypt');
var fs = require('fs');
router.get('/',Auth_mdw.check_login, function(req, res, next) {
  res.render('backend/event');
});


router.post('/add-event', function(req, res, next) {
  const v = new Validator(req.body, {
    nama: 'required',
    organizer: 'required',
    start: 'required',
    end: 'required',
    place: 'required',
    image: 'required',
  });
  v.check().then((matched) => {
    if (!matched) {
      res.json({"errors":[v.errors]});
    }else{
      let Datapost = [{
        nama: req.body.nama, 
        organizer: req.body.organizer,
        start: req.body.start, 
        end: req.body.end,
        place: req.body.place, 
        image: req.file.path,
      }];
      console.log(Datapost);
        knex.transaction(function(trx) {
          knex('tbl_event').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          res.status(200).json({
            status: true,
            message:resp
          });
        }).catch(function(err) {
          res.status(500).json({
            status: 500,
            message: err
          });
        });
    }
  });
});
module.exports = router;
