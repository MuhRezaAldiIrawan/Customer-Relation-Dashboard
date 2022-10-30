var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const database = require('../database/database');

/* GET users listing. */

router.get('/',Auth_mdw.check_login, function (req, res, next) {
  database.query('SELECT * FROM tbl_event ORDER BY id desc', function (err, rows) {
    if (err) {
      req.flash('error', err)
      res.render('backend/eventlist', { data: '' })
    } else {
      res.render('backend/eventlist', { data: rows })
    }
  })
})
// router.get('/',Auth_mdw.check_login, function(req, res, next) {
//   res.render('backend/eventlist');
// });

// router.post("/action", function(request, response, next){

// 	var action = request.body.action;

// 	if(action == 'fetch')
// 	{
// 		var query = "SELECT * FROM tbl_event ORDER BY id DESC";

// 		database.query(query, function(error, data){

// 			response.json({
// 				data:data
// 			});

// 		});
// 	}

// });

module.exports = router;
