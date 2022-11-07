var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const database = require('../database/database');


/* GET users listing. */

router.get('/',Auth_mdw.check_login, function (req, res, next) {
  database.query('SELECT * FROM tbl_event', function (err, rows) {
    if (err) {
      req.flash('error', err)
      res.render('backend/eventlist', { data: '' })
    } else {
      res.render('backend/eventlist', { data: rows })
    }
  })
});
router.get('/getdata',Auth_mdw.check_login, function (req, res, next) {
  database.query('SELECT * FROM tbl_event', function (err, rows) {
    if (err) {
      req.flash('error', err)
      res.render('backend/eventlist', { data: '' })
    } else {
      res.render('backend/eventlist', { data: rows })
    }
  })
});

router.get('/deleteitem/(:id)', (req, res) => {
  // buat query sql untuk mencari data dan hapus
  const querySearch = 'SELECT * FROM tbl_event WHERE id = ?';
  const queryDelete = 'DELETE FROM tbl_event WHERE id = ?';

  // jalankan query untuk melakukan pencarian data
  database.query(querySearch, req.params.id, (err, rows, field) => {
      // error handling
      if (err) {
          return res.status(500).json({ message: 'Ada kesalahan', error: err });
      }

      // jika id yang dimasukkan sesuai dengan data yang ada di db
      if (rows.length) {
          // jalankan query delete
          database.query(queryDelete, req.params.id, (err, rows, field) => {
              // error handling
              if (err) {
                  return res.status(500).json({ message: 'Ada kesalahan', error: err });
              }

              // jika delete berhasil
              res.redirect('/')
              // res.status(200).json({ success: true, message: 'Berhasil hapus data!' });
          });
      } else {
          return res.status(404).json({ message: 'Data tidak ditemukan!', success: false });
      }
  });
});

// router.get('/delete-event/:id', function(req, res, next) {
//   console.log(req.params.id);
//   knex.transaction(function(trx) {
//     knex('tbl_event').where({
//       id: req.params.id
//     }).del()
//         .then()
//         .then(trx.commit)
//         .catch(trx.rollback);
//     }).then(function(data) {
//       res.json({ success: true, message: data });
//     }).catch(function(err) {
//       console.error(err);
//     });
// });

// router.get('/deleteitem/(:id)', function (req, res, next){
//   database.query('DELETE FROM tbl_event WHERE id = ?', req.query.id, function (err,rs){
//     res.redirect('/');
//   })
// })

module.exports = router;
