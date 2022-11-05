var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const database = require('../database/database');

/* GET users listing. */

// router.get('/',Auth_mdw.check_login, function (req, res, next) {
//   database.query('SELECT * FROM tbl_event ORDER BY id desc', function (err, rows) {
//     if (err) {
//       req.flash('error', err)
//       res.render('backend/detailevent', { data: '' })
//     } else {
//       res.render('backend/detailevent', { data: rows })
//     }
//   })
// });

router.get('/edit/(:id)', function(request, response, next){

	var id = request.params.id;

	var query = `SELECT * FROM tbl_event WHERE id = "${id}"`;

	database.query(query, function(error, data){

		response.render('backend/detailevent', {title: 'Edit MySQL Table Data', action:'edit', data:data[0]});

	});

});

router.post('/update/:id', function(req, res, next) {
  var id = req.body.id;

  var query = "UPDATE tbl_event SET nama='"+req.body.nama+"',  organizer='"+req.body.organizer+"',  start='"+req.body.start+"',  end='"+req.body.end+"',  place='"+req.body.place+"' where id ="+id;

  database.query(query, function(error, data){

		res.render('backend/detailevent');

	});

});

// router.get('/update', function(request, response, next){

// 	var id = request.body.id;

// 	var query = `UPDATE tbl_event SET  nama='"+req.body.nama+"', organizer='"+req.body.organizer+"', start='"+req.body.start+"', end='"+req.body.end+"', place='"+req.body.place+"' WHERE id = "${id}"`;

// 	database.query(query, function(error, data){

// 		response.render('backend/detailevent', {title: 'Edit MySQL Table Data', action:'edit', data:data[0]});

// 	});

// });

module.exports = router;
