var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const knex = require('../database');

/* GET users listing. */
router.get('/',Auth_mdw.check_login, function(req, res, next) {
  res.render('backend/contact');
});

router.get('/ListContact',Auth_mdw.check_login, function(req, res, next) {
  knex.transaction(function(trx) {
    knex('tbl_contact').transacting(trx).select('*')
        .then()
        .then(trx.commit)
        .catch(trx.rollback);
    }).then(function(resp) {
      res.status(200).json({
        status: true,
        data: resp
      });
    }).catch(function(err) {
      console.log(err)
    });
});


module.exports = router;
