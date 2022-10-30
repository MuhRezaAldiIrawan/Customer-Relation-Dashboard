var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
/* GET home page. */
router.get('/', Auth_mdw.check_login,function(request, response) {
	response.render('backend/home', {emails:request.session.email });
});

module.exports = router;
