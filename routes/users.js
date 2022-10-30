var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
var knex = require('../database');
const { Validator } = require('node-input-validator');
var nodemailer  = require('nodemailer');
var bcrypt = require('bcrypt');
var fs = require('fs');
/* GET users listing. */
router.get('/', Auth_mdw.check_login,function(req, res, next) {
  res.render('backend/users');
});

router.post('/add-users', function(req, res, next) {
  const v = new Validator(req.body, {
    username: 'required',
    email: 'required|email',
    password: 'required',
    role: 'required',
  });
  v.check().then((matched) => {
    if (!matched) {
      res.json({"errors":[v.errors]});
    }else{
      let Datapost = [{
        username: req.body.username, 
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password,10),
        role: req.body.role,
        created_at:'2021-05-08 00:00:00',
      }];
      console.log(Datapost);
        knex.transaction(function(trx) {
          knex('tbl_users').transacting(trx).insert(Datapost)
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
router.get('/edit-users/:id', function(req, res, next) {
  console.log(req.params.id);
  knex.transaction(function(trx) {
    knex('tbl_users').where({
      id: req.params.id
    }).select('*')
        .then()
        .then(trx.commit)
        .catch(trx.rollback);
    }).then(function(data) {
      res.status(200).json({
        status: 200,
        data:data
      });
  });
});
router.get('/data-users', function(req, res, next) {
  return new Promise(function(resolve, reject){
      knex.select().from('tbl_users')
      .then((response) => {
        resolve(
          res.json({
            data: response
          })
        );
      }).catch(error => reject(error))
  });
});
router.post('/update-users', function(req, res, next) {
  const v = new Validator(req.body, {
    username: 'required',
    email: 'required|email',
    role: 'required',
  });
  v.check().then((matched) => {
    if (!matched) {
      res.json({"warning":[v.errors]});
    }else{
      let id=req.body.id;
      console.log(id)
      knex.transaction(function(trx) {
        knex('tbl_users').transacting(trx).update(
          {username: req.body.username, 
            email: req.body.email,
            role: req.body.role,
          }).where('id',id)
          .then()
          .then(trx.commit)
          .catch(trx.rollback);
      }).then(function(resp) {
        res.status(200).json({
          status: true,
          message:resp
        });
      }).catch(function(err) {
        res.json(err);
      });
    }
  });
});
router.get('/delete-users/:id', function(req, res, next) {
  console.log(req.params.id);
  knex.transaction(function(trx) {
    knex('tbl_users').where({
      id: req.params.id
    }).del()
        .then()
        .then(trx.commit)
        .catch(trx.rollback);
    }).then(function(data) {
      res.json({ success: true, message: data });
    }).catch(function(err) {
      console.error(err);
    });
});
router.get('/reset-password/:id', function(req, res, next) {
  knex.transaction(function(trx) {
    knex('tbl_users').transacting(trx).update(
      {password: bcrypt.hashSync('123456',10)}
      ).where('id',req.params.id)
      .then()
      .then(trx.commit)
      .catch(trx.rollback);
  }).then(function(resp) {
    res.status(200).json({
      status: true,
      message:resp
    });
  }).catch(function(err) {
    res.json(err);
  });
});

router.get('/email-users', function(req, res, next) {
  var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'pmb@uma.ac.id',
          pass: 'pmbuma2021'
      }
  });
  var mailOptions = {
      from: 'pmb@uma.ac.id',
      to: 'riques_for_you@yahoo.com,nodedemycourse@gmail.com',
      subject: 'Sending Email using Nodejs BY IMAM WASMAWI BY SERVER PMB',
      text: 'LELAH SEKALI MEMPELAJARI INI SEMUA (TIDAK ADA ILMU YANG SIA SIA)',
      attachments:
      [
        {
          name:'Lihatlah gambar ini.png',
          path:'./public/assets/img/profile2.jpg'
        },
        {
          name:'Lihatlah gambar ini.png',
          path:'./public/assets/img/profile2.jpg'
        }
      ]
  };
  transporter.sendMail(mailOptions, (err, info) => {
      if (err) throw err;
      // console.log('Email sent: ' + info.response);
      res.json('Email sent: ' + info.response);
  });
});


router.get('/logs', function(req, res, next) {
  fs.readFile('./logs.log', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    res.json(data);
  })
});

module.exports = router;
