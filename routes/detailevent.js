var express = require('express');
var router = express.Router();
var Auth_mdw = require('../middlewares/auth');
const database = require('../database/database');

/* GET users listing. */



router.get('/edit/(:id)', function(request, response, next){

	var id = request.params.id;

	var query = `SELECT * FROM tbl_event WHERE id = "${id}"`;

	database.query(query, function(error, data){

		response.render('backend/detailevent', {title: 'Edit MySQL Table Data', action:'edit', data:data[0]});

	});

});

router.post('/update/(:id)', (req, res) => {
    // buat variabel penampung data dan query sql
    const data = { ...req.body };
    const querySearch = 'SELECT * FROM tbl_event WHERE id = ?';
    const queryUpdate = 'UPDATE tbl_event SET ? WHERE id = ?';

    // jalankan query untuk melakukan pencarian data
    database.query(querySearch, req.params.id, (err, rows, field) => {
        // error handling
        if (err) {
            return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }

        // jika id yang dimasukkan sesuai dengan data yang ada di db
        if (rows.length) {
            // jalankan query update
            database.query(queryUpdate, [data, req.params.id], (err, rows, field) => {
                // error handling
                if (err) {
                    return res.status(500).json({ message: 'Ada kesalahan', error: err });
                }

                // jika update berhasil
				res.redirect('/')
                // res.status(200).json({ success: true, message: 'Berhasil update data!' });
            });
        } else {
            return res.status(404).json({ message: 'Data tidak ditemukan!', success: false });
        }
    });
});
module.exports = router;
