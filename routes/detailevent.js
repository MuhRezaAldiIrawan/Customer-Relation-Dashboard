var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const database = require('../database/database');

/* GET users listing. */

router.get('/',Auth_mdw.check_login, function (req, res, next) {
  database.query('SELECT * FROM tbl_event ORDER BY id desc', function (err, rows) {
    if (err) {
      req.flash('error', err)
      res.render('backend/detailevent', { data: '' })
    } else {
      res.render('backend/detailevent', { data: rows })
    }
  })
});

router.get('/edit/:id', function(request, response, next){

	var id = request.params.id;

	var query = `SELECT * FROM tbl_event WHERE id = "${id}"`;

	database.query(query, function(error, data){

		response.render('backend/detailevent', {title: 'Edit MySQL Table Data', action:'edit', data:data[0]});

	});

});

router.post('/edit/:id', function(request, response, next){

	var id = request.params.id;

	var nama = request.body.nama;

	var organizer = request.body.organizer;

	var start = request.body.start;

	var end = request.body.end;
  
	var place = request.body.place;

	var query = `UPDATE tbl_event SET 
  nama = "${nama}", 
	organizer = "${organizer}", 
	start = "${start}", 
	end = "${end}" ,
  place = "${place}" 
	WHERE id = "${id}"
	`;

	database.query(query, function(error, data){

		if(error)
		{
			throw error;
		}
		else
		{
			response.redirect('backend/detailevent');
		}

	});

});

module.exports = router;
