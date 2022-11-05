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

// router.get('/listevent/:id', function(request, response, next){

// 	var id = request.params.id;

// 	var query = `SELECT * FROM tbl_event WHERE id = "${id}"`;

// 	database.query(query, function(error, data){

// 		response.render('backend/eventlist', {title: 'Edit MySQL Table Data', action:'edit', data:data[i]});

// 	});

// });



// router.get('/edit/(:id)', function(req, res, next) {

//   let id = req.params.id;
 
//   database.query('SELECT * FROM tbl_event WHERE id = ' + id, function(err, rows, fields) {
//       if(err) throw err
       
//       // if user not found
//       if (rows.length <= 0) {
//           req.flash('error', 'Data Event Dengan ID ' + id + " Tidak Ditemukan")
//           res.redirect('backend/eventlist')
//       }
//       // if book found
//       else {
//           // render to edit.ejs
//           res.render('backend/eventlist/edit', {
//               id:      rows[0].id,
//               nama:      rows[0].nama,
//               organizer:   rows[0].organizer,
//               start: rows[0].start,
//               end:      rows[0].end,
//               place:   rows[0].place,
              
//           })
//       }
//   })
// })

// /**
// * UPDATE POST
// */
// router.post('/update/:id', function(req, res, next) {

//   let id      = req.params.id;
//   let nama      = req.body.nama;
//   let organizer   = req.body.organizer;
//   let start = req.body.start;
//   let end   = req.body.end;
//   let place = req.body.place;
//   let errors  = false;

//   if(nama.length === 0) {
//       errors = true;

//       // set flash message
//       req.flash('error', "Silahkan Masukkan Nama Event");
//       // render to edit.ejs with flash message
//       res.render('backend/eventlist/edit', {
//           id:         req.params.id,
//           nama:         nama,
//           organizer:      organizer,
//           start:    start,
//           end:    end,
//           place:    place,

//       })
//   }

//   if(organizer.length === 0) {
//       errors = true;

//       // set flash message
//       req.flash('error', "Silahkan Masukkan Organizer Event");
//       // render to edit.ejs with flash message
//       res.render('backend/eventlist/edit', {
//         id:         req.params.id,
//         nama:      nama,
//         organizer:      organizer,
//         start:    start,
//         end:    end,
//         place:    place,

//       })
//   }

//   // if no error
//   if( !errors ) {   

//       let formData = {
//           nama: nama,
//           organizer: organizer,
//           start: start,
//           end: end,
//           place: place
          
//       }

//       // update query
//       database.query('UPDATE tbl_event SET ? WHERE id = ' + id, formData, function(err, result) {
//           //if(err) throw err
//           if (err) {
//               // set flash message
//               req.flash('error', err)
//               // render to edit.ejs
//               res.render('backend/eventlist/edit', {
//                   id:         req.params.id,
//                   nama:   formData.nama,
//                   organizer: formData.organizer,
//                   start:   formData.start,
//                   end: formData.end,
//                   place: formData.place,
                  

//               })
//           } else {
//               req.flash('success', 'Data Berhasil Diupdate!');
//               res.redirect('backend/eventlist/');
//           }
//       })
//   }
// })


module.exports = router;
