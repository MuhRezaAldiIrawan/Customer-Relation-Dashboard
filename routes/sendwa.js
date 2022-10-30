var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const axios = require("axios")
const cheerio = require("cheerio")

/* GET users listing. */
router.get('/', Auth_mdw.check_login,function(req, res, next) {
  return res.render('backend/sendwa',{
    success: req.flash("success"),
    errors: req.flash("errors")
  });
});

router.get('/listSender', Auth_mdw.check_login,function(req, res, next) {
  const SESSIONS_FILE = './whatsapp-sessions.json';
  var data = JSON.parse(fs.readFileSync(SESSIONS_FILE)).filter(function (entry) {
      return entry;
  });
  return res.status(200).json({
    status: 200,
    data:data,
    message: 'success'
  });
 
});

router.get('/version', Auth_mdw.check_login, async function(req, res, next) {

  const url = 'https://github.com/pedroslopez/whatsapp-web.js/releases';
  let result =await axios.get(url).then((res)=>{
      const html = res.data;
      const $ =cheerio.load(html);
      let profiles_ = $(".flex-1");
      let profiles=[];
      profiles_.each(function(){
          profiles.push({
              version:$('a.Link--primary').text(),
          });
      });
      return {
          status:200,
          message:"success",
          data:profiles,
      };
  });

  return res.status(200).json({
    status: 200,
    data:result,
    message: 'success'
  });
  
});

module.exports = router;
