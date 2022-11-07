var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ejs = require('ejs-locals');
const schedule = require('node-schedule');


const multer = require('multer');
 

// const http = require('http');
var session = require('express-session');
var bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const { phoneNumberFormatter } = require('./helpers/formatter');
const knex = require('./database');
var connection = require('./database/database')
const { Client, MessageMedia ,LocalAuth} = require('whatsapp-web.js');
const winston = require('winston');
// const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const importExcel = require('convert-excel-to-json');
const axios = require('axios');
var flash = require('connect-flash');
// var flash = require('express-flash');
const log4js = require('log4js');
log4js.configure({
  appenders: { everything: { type: 'file', filename: 'logs.log' } },
  categories: { default: { appenders: ['everything'], level: 'ALL' } }
});
const loggers = log4js.getLogger();
const del = require('del');

var dashboardRouter = require('./routes/dashboard');
var agentRouter = require('./routes/agent');
var pmRouter = require('./routes/pm');
var bmRouter = require('./routes/bm');
var messagelistRouter = require('./routes/messagelist');
var grouplistRouter = require('./routes/grouplist');
var contactRouter = require('./routes/contact');
var userRouter = require('./routes/user');
var eventRouter = require('./routes/event');
var eventlistRouter = require('./routes/eventlist');
var detaileventRouter = require('./routes/detailevent');
var toyotaRouter = require('./routes/toyota');




var indexRouter = require('./routes/index');

var loginRouter = require('./routes/login');


var app = express();
// var sessionStore = new session.MemoryStore;
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { maxAge: 60000 },
}));
app.use(flash());

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// default options
app.use(fileUpload());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs',ejs);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Route CR-PROJECT
app.use('/', loginRouter);
app.use('/home', indexRouter);
app.use('/login', loginRouter);
app.use('/auth',loginRouter);
app.use('/logout',loginRouter);
app.use('/dashboard', dashboardRouter);
app.use('/agent', agentRouter);
app.use('/pm', pmRouter);
app.use('/pm/send-message', pmRouter);
app.use('/pm/listSender', pmRouter);
app.use('/pm/version', pmRouter);
app.use('/bm', bmRouter);
app.use('/bm/send-broadcastwa', bmRouter);
app.use('/message', messagelistRouter);
app.use('/message/MessageList', messagelistRouter);
app.use('/grouplist', grouplistRouter);
app.use('/grouplist/ListGroups', grouplistRouter);
app.use('/contact', contactRouter);
app.use('/contact/ListContact', contactRouter);
app.use('/contact/import-csv', contactRouter);
app.use('/user', userRouter);
app.use('/user/add-users', userRouter);
app.use('/user/data-users', userRouter);
app.use('/user/update-users', userRouter);
app.use('/user/delete-users', userRouter);
app.use('/user/email-users', userRouter);
app.use('/user/edit-users', userRouter);
app.use('/user/reset-password', userRouter);
app.use('/user/logs', userRouter);
app.use('/event', eventRouter);
app.use('/event/addevent', eventRouter);
app.use('/listevent', eventlistRouter);
app.use('/listevent/getdata', eventlistRouter);
app.use('/listevent//deleteitem', eventlistRouter);
app.use('/listevent/delete-event', eventlistRouter);
app.use('/detailevent', detaileventRouter);
app.use('/detailevent/edit', detaileventRouter);
app.use('/detailevent/update', detaileventRouter);
app.use('/toyota', toyotaRouter);
//End Project

const logging = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logging.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

var sockIO = require('socket.io')();
app.sockIO = sockIO;

const sessions = [];
const SESSIONS_FILE = './whatsapp-sessions.json';
const createSessionsFileIfNotExists = function() {
  if (!fs.existsSync(SESSIONS_FILE)) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      console.log('Sessions file created successfully.');
      loggers.debug('Sessions file created successfully');
    } catch(err) {
      console.log('Failed to create sessions file: ', err);
      loggers.error('Failed to create sessions file: ', err);
    }
  }
}
createSessionsFileIfNotExists();

const setSessionsFile = function(sessions) {
  fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions), function(err) {
    if (err) {
      console.log(err);
    }
  });
}

const getSessionsFile = function() {
  var List = JSON.parse(fs.readFileSync(SESSIONS_FILE)).filter(function (entry) {
      // return entry.userid === 'imam@uma.ac.id';
      return entry;
  });
  return List;
  // return JSON.parse(fs.readFileSync(SESSIONS_FILE));
}
const createSession = function(id,userid, description) {
  console.log('Creating session: ' + id);
 let check = knex.transaction(function(trx) {
    knex('tbl_wa').where({
      idwa:id
    }).select('*')
        .then()
        .then(trx.commit)
        .catch(trx.rollback);
    }).then(function(resp) {
      if(resp.length){
        console.log('Session Already: ' + id);
        loggers.info('Session Already: ' + id);
      }else{
        // Create Session To Database
        let Datapost = [{
          userid:userid,
          description:description,
          file:`whatsapp-session-${id}.json`,
          idwa:id,
        }];
        loggers.debug('Session Created: ' + id);
        knex.transaction(function(trx) {
        knex('tbl_wa').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          console.log(resp)
          loggers.debug('Insert Session Created: ' + resp);
        }).catch(function(err) {
          console.log(err)
          loggers.error('Error Session Created: ' + err);
        });
      }
    }).catch(function(err) {
      console.log(err)
    });

  const SESSION_FILE_PATH = `./.wwebjs_auth/session-${id}`;
  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ],
    },
    authStrategy: new LocalAuth({
      clientId: id
    })
  });

  client.on('message', msg => {
    if (msg.body == '!ping') {
      msg.reply('pong');
    } else if (msg.body == 'good morning') {
      msg.reply('selamat pagi');
    } else if (msg.body == '!groups') {
      client.getChats().then(chats => {
        const groups = chats.filter(chat => chat.isGroup);
  
        if (groups.length == 0) {
          msg.reply('You have no group yet.');
        } else {
          let replyMsg = '*YOUR GROUPS*\n\n';
          groups.forEach((group, i) => {
            replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
          });
          replyMsg += '_You can use the group id to send a message to the group._'
          msg.reply(replyMsg);
        }
      });
    }
  });

  client.initialize();
  client.on('qr', (qr) => {
    logging.log({
      level: 'info',
      message: 'QR RECEIVED'
    });
    console.log('QR RECEIVED', qr);
    var QRCode = require('qrcode')
    QRCode.toDataURL(qr, function (err, url) {
      sockIO.emit('qr', { id: id, src: url });
      sockIO.emit('message', { id: id, text: 'QR Code received, scan please!' });
      loggers.info('message', { id: id, text: 'QR Code received, scan please!' });
    })
  });

  client.on('ready', () => {
    sockIO.emit('ready', { id: id });
    sockIO.emit('message', { id: id, text: 'Whatsapp is ready!' });
    loggers.info('message', { id: id, text: 'Whatsapp is ready!' });
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions[sessionIndex].ready = true;
    setSessionsFile(savedSessions);
  });

  client.on('authenticated', () => {
    sockIO.emit('authenticated', { id: id });
    sockIO.emit('message', { id: id, text: 'Whatsapp is authenticated!' });
    loggers.debug('message', { id: id, text: 'Whatsapp is authenticated!' });
  });

  client.on('auth_failure', function() {
    sockIO.emit('message', { id: id, text: 'Auth failure, restarting...' });
    loggers.info('message Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    sockIO.emit('message', { id: id, text: 'Whatsapp is disconnected!' });
    loggers.info('Whatsapp is disconnected! '+ reason);
    
    // fs.unlinkSync(SESSION_FILE_PATH, function(err) {
    //     if(err) return console.log(err);
    //     console.log('Session file deleted!');
    //     loggers.error('Session file deleted');
    // });

    client.destroy();
    client.initialize();

    // Menghapus pada file sessions
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
    savedSessions.splice(sessionIndex, 1);
    setSessionsFile(savedSessions);
    sockIO.emit('remove-session', id);
  });

  // Tambahkan client ke sessions
  sessions.push({
    id: id,
    userid:userid,
    // userid:'imam@uma.ac.id',
    description: description,
    client: client
  });

  // Menambahkan session ke file
  const savedSessions = getSessionsFile();
  const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
  if (sessionIndex == -1) {
    savedSessions.push({
      id: id,
      userid:userid,
      // userid:'imam@uma.ac.id',
      description: description,
      ready: false,
    });
    setSessionsFile(savedSessions);
  }
}
const init = function(socket) {
  const savedSessions = getSessionsFile();
  if (savedSessions.length > 0) {
    if (socket) {
      socket.emit('init', savedSessions);
    } else {
      savedSessions.forEach(sess => {
        createSession(sess.id,sess.userid, sess.description);
      });
    }
  }
}
init();

const getAccountData = () => {
  const jsonData = fs.readFileSync(SESSIONS_FILE)
  return JSON.parse(jsonData)    
}
const saveAccountData = (data) => {
  const stringifyData = JSON.stringify(data)
  fs.writeFileSync(SESSIONS_FILE, stringifyData)
}

sockIO.on('connection', function(sockIO){
  init(sockIO);
  sockIO.on('create-session', function(data) {
    console.log('Create session: ' + data.id);
    createSession(data.id,data.userid, data.description);
    loggers.debug('Create session: ' + data.id);
  });

  sockIO.on('broadcastwa', function(data) {
    console.log('broadcastwa: ' + data);
    loggers.info('broadcastwa: ' + data);
  });

  sockIO.on('delete-session', function(data){
    console.log('Delete session: ' + data.id);
    loggers.debug('Delete session: ' + data.id);
    
    const id = data.id
    const existAccounts = getAccountData()
    const filterUser = existAccounts.filter( user => user.id !== id )
    if(filterUser){
      saveAccountData(filterUser);
    }
  });

});

app.get('/log', (req, res) => {
  res.sendFile(path.join(__dirname + '/logs.log'));
});


// send-broadcast
app.post('/send-broadcastwa',[
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/send-message message: Error '+Object.values(errors.mapped()));
    req.flash('errors',Object.values(errors.mapped()));
    res.redirect('/broadcast');
  }
  
  const sender = req.body.sender;
  const message = req.body.message;
  var listNumber = req.body.number.split(",");

  // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/send-message message: Client Not Found Please Create Account Whats Up And Scan Barcode ');
    req.flash('errors', 'Client Not Found Please Create Account Whats Up And Scan Barcode');
    res.redirect('/broadcast');
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/send-message message: Please Scan Barcode Now In App');
  //   req.flash('errors', 'Please Scan Barcode Now In App');
  //   res.redirect('/broadcast');
  // }

  let date_ob = new Date();
  // current seconds
  let seconds = date_ob.getSeconds();
  listNumber.forEach((item, i) => {
    setTimeout(async() => {
        let kontak = phoneNumberFormatter(item);
        const client = sessions.find(sess => sess.id == sender).client;
        const isRegisteredNumber = await client.isRegisteredUser(kontak);
        // cek kalau nomor hp tidak terdaftar di wa
        if (!isRegisteredNumber) {
          loggers.info('Not Register WhatsUp');
          console.log(i + " not register - " + item+ " - " + seconds);
          sockIO.emit('broadcastwa', { id:i, text:item+ ' not register',type:'warning'});
        }
        // cek kalau nomor hp terdaftar di wa
        if(isRegisteredNumber){
          client.sendMessage(kontak, message).then(response => {
            loggers.info(response);
            console.log(i + " success - " + item+ " - " + seconds);
            sockIO.emit('broadcastwa', { id:i, text:item+ ' success' ,type:'success'});
          }).catch(err => {
            loggers.error(err);
            console.log(i + " error - " + item+ " - " + seconds);
            sockIO.emit('broadcastwa', { id:i, text:item+ ' error' ,type:'error'});
          });
        }
    }, i * 15000);
  });
  req.flash('success', 'Progress Send Whats Up');
  res.redirect('/broadcast');
});


// const importExcel = require('convert-excel-to-json');
app.post('/send-broadcast-excel', (req, res) => {
  let file = req.files.filename;
  let filename = file.name;
  let listNumber=[];
  const sender = req.body.sender;
  const message = req.body.message;
  let date_ob = new Date();
  // current seconds
  let seconds = date_ob.getSeconds();
  file.mv('./public/excel/'+filename,(err)=>{
    if(err){
      return res.status(422).json({
        status: 422,
        message: err
      });
    }else{
      let result = importExcel({
        sourceFile:'./public/excel/'+filename,
        header:{row:1},
        sheets:['Sheet1']
      });
      for(var i=0; result.Sheet1.length > i; i++){
        listNumber.push(result.Sheet1[i].A);
      }
      listNumber.forEach((item, i) => {
        setTimeout(async() => {
            let kontak = phoneNumberFormatter(item);
            const client = sessions.find(sess => sess.id == sender).client;
            const isRegisteredNumber = await client.isRegisteredUser(kontak);
            // cek kalau nomor hp tidak terdaftar di wa
            if (!isRegisteredNumber) {
              loggers.info('Not Register WhatsUp');
              console.log(i + " not register - " + item+ " - " + seconds);
              sockIO.emit('broadcastwa', { id:i, text:item+ ' not register',type:'warning'});
            }
            // cek kalau nomor hp terdaftar di wa
            if(isRegisteredNumber){
              client.sendMessage(kontak, message).then(response => {
                loggers.info(response);
                console.log(i + " success - " + item+ " - " + seconds);
                sockIO.emit('broadcastwa', { id:i, text:item+ ' success' ,type:'success'});
              }).catch(err => {
                loggers.error(err);
                console.log(i + " error - " + item+ " - " + seconds);
                sockIO.emit('broadcastwa', { id:i, text:item+ ' error' ,type:'error'});
              });
            }
        }, i * 15000);
      });
      req.flash('success', 'Progress Send Whats Up');
      res.redirect('/broadcast');
    }
  })
});

// send-broadcast
app.post('/api-v1/send-broadcast',[
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/api-v1/send-broadcast message: Error '+Object.values(errors.mapped()));
    return res.status(422).json({
      status: 422,
      message: errors.mapped()
    });
  }
  const sender = req.body.sender;
  const message = req.body.message;
  var listNumber = req.body.strArr.split(",");

  // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/api-v1/send-broadcast: Client Not Found Please Create Account Whats Up And Scan Barcode ');
    return res.status(422).json({
      status: 422,
      message: 'Client Not Found Please Create Account Whats Up And Scan Barcode'
    });
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/api-v1/send-broadcast: Please Scan Barcode Now In App');
  //   return res.status(422).json({
  //     status: 422,
  //     message: 'Please Scan Barcode Now In App'
  //   });
  // }

  let date_ob = new Date();
  // current seconds
  let seconds = date_ob.getSeconds();
  listNumber.forEach((item, i) => {
    setTimeout(async() => {
        let kontak = phoneNumberFormatter(item);
        const client = sessions.find(sess => sess.id == sender).client;
        const isRegisteredNumber = await client.isRegisteredUser(kontak);
        // cek kalau nomor hp tidak terdaftar di wa
        if (!isRegisteredNumber) {
          loggers.info('Not Register WhatsUp');
          console.log(i + " not register - " + item+ " - " + seconds);
          sockIO.emit('broadcastwa', { id:i, text:item+ ' not register',type:'warning'});
        }
        // cek kalau nomor hp terdaftar di wa
        if(isRegisteredNumber){
          client.sendMessage(kontak, message).then(response => {
            loggers.info(response);
            console.log(i + " success - " + item+ " - " + seconds);
            sockIO.emit('broadcastwa', { id:i, text:item+ ' success' ,type:'success'});
          }).catch(err => {
            loggers.error(err);
            console.log(i + " error - " + item+ " - " + seconds);
            sockIO.emit('broadcastwa', { id:i, text:item+ ' error' ,type:'error'});
          });
        }
        
    }, i * 15000);
  });
  res.json({status:200});
});
// API Send message
app.post('/api-v1/send-message', [
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/api-v1/send-message message:' + errors.mapped());
    return res.status(422).json({
      status: 422,
      message: errors.mapped()
    });
  }
  const sender = req.body.sender;
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;
  // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/api-v1/send-message message:Client Not Found Please Create Account Whats Up And Scan Barcode');
    return res.status(422).json({
      status: 422,
      message: 'Client Not Found Please Create Account Whats Up And Scan Barcode'
    });
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/api-v1/send-message message:Please Scan Barcode Now In App');
  //   return res.status(422).json({
  //     status: 422,
  //     message: 'Please Scan Barcode Now In App'
  //   });
  // }
  const client = sessions.find(sess => sess.id == sender).client;
  const isRegisteredNumber = await client.isRegisteredUser(number);
  // cek kalau nomor hp terdaftar di wa
  if (!isRegisteredNumber) {
    loggers.info('url:/api-v1/send-message message:The number is not registered');
    return res.status(422).json({
      status: 422,
      message: 'The number is not registered'
    });
  }
  if(isRegisteredNumber){
    client.sendMessage(number, message).then(response => {
      let Datapost = [{
        sender: sender, 
        number: number,
        message: message,
        desc: 'message',
        status: 'terkirim',
      }];
        loggers.debug('url:/api-v1/send-message message:success send '+number);
        knex.transaction(function(trx) {
        knex('tbl_message').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          console.log(resp)
          loggers.debug('url:/api-v1/send-message message:Query Insert '+resp);
          res.status(200).json({
            status: 200,
            response: response
          });
        }).catch(function(err) {
          console.log(err)
          loggers.error('url:/api-v1/send-message message: Failed Query Insert '+err);
          res.status(500).json({
            status: 500,
            response: err
          });
        });
    
    }).catch(err => {
      loggers.fatal('url:/api-v1/send-message message: '+err);
      res.status(500).json({
        status: 500,
        message: err
      });
    });
  }
});
// API Send media
app.post('/api-v1/send-media',[
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('caption').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/api-v1/send-media message:'+errors.mapped());
    return res.status(202).json({
      status: 202,
      message: errors.mapped()
    });
  }
  if (!req.files || Object.keys(req.files).length === 0) {
    loggers.info('url:/api-v1/send-media message: No files were uploaded');
    return res.status(400).json({
      status: 400,
      message: 'No files were uploaded.'
    });
  }
  const sender = req.body.sender;
  const caption = req.body.caption;
  const number = phoneNumberFormatter(req.body.number);
   // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/api-v1/send-media message: Client Not Found Please Create Account Whats Up And Scan Barcode');
    return res.status(422).json({
      status: 422,
      message: 'Client Not Found Please Create Account Whats Up And Scan Barcode'
    });
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/api-v1/send-media message: Please Scan Barcode Now In App');
  //   return res.status(422).json({
  //     status: 422,
  //     message: 'Please Scan Barcode Now In App'
  //   });
  // }
  const client = sessions.find(sess => sess.id == sender).client;
  const isRegisteredNumber = await client.isRegisteredUser(number);
  if (!isRegisteredNumber) {
    loggers.info('url:/api-v1/send-media message: The number is not registered');
    return res.status(201).json({
      status: 201,
      message: 'The number is not registered'
    });
  }
  if(isRegisteredNumber){
    const file = req.files.file;
    const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
    client.sendMessage(number, media, {
      caption: caption
    }).then(response => {
      loggers.debug('url:/api-v1/send-media message: success send '+number);
      let Datapost = [{
        sender: sender, 
        number: number,
        message: caption,
        desc: 'media',
        status: 'terkirim',
      }];
        knex.transaction(function(trx) {
        knex('tbl_message').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          console.log(resp)
          loggers.debug('url:/api-v1/send-media message: success insert query '+resp);
          res.status(200).json({
            status: 200,
            response: response
          });
        }).catch(function(err) {
          console.log(err)
          loggers.error('url:/api-v1/send-media message: failed insert query '+err);
          res.status(500).json({
            status: 500,
            response: err
          });
        });
    }).catch(err => {
      loggers.fatal('url:/api-v1/send-media message:'+err);
      res.status(500).json({
        status: 500,
        message: err
      });
    });
  }
});
// API Send media url
app.post('/api-v1/send-media-url',[
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/api-v1/send-media-url message: '+errors.mapped());
    return res.status(202).json({
      status: 202,
      message: errors.mapped()
    });
  }
  const sender = req.body.sender;
  const caption = req.body.caption;
  const number = phoneNumberFormatter(req.body.number);
   // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/api-v1/send-media-url message: Client Not Found Please Create Account Whats Up And Scan Barcode ');
    return res.status(422).json({
      status: 422,
      message: 'Client Not Found Please Create Account Whats Up And Scan Barcode'
    });
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/api-v1/send-media-url message: Please Scan Barcode Now In App');
  //   return res.status(422).json({
  //     status: 422,
  //     message: 'Please Scan Barcode Now In App'
  //   });
  // }
  const client = sessions.find(sess => sess.id == sender).client;
  const isRegisteredNumber = await client.isRegisteredUser(number);
  if (!isRegisteredNumber) {
    loggers.info('url:/api-v1/send-media-url message: The number is not registered');
    return res.status(201).json({
      status: 201,
      message: 'The number is not registered'
    });
  }
  if(isRegisteredNumber){
    const fileUrl = req.body.file;
    let mimetype;
    const attachment = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    }).then(response => {
      mimetype = response.headers['content-type'];
      return response.data.toString('base64');
    });
    const media = new MessageMedia(mimetype, attachment, 'Media');
    client.sendMessage(number, media, {
      caption: caption
    }).then(response => {
      let Datapost = [{
        sender: sender, 
        number: number,
        message: caption,
        desc: 'media',
        status: 'terkirim',
      }];
        loggers.debug('url:/api-v1/send-media-url message: success send '+number);
        knex.transaction(function(trx) {
        knex('tbl_message').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          console.log(resp)
          loggers.debug('url:/api-v1/send-media-url message: query insert '+resp);
          res.status(200).json({
            status: 200,
            response: response
          });
        }).catch(function(err) {
          console.log(err)
          loggers.error('url:/api-v1/send-media-url message: failed query insert '+err);
          res.status(500).json({
            status: 500,
            response: err
          });
        });

    }).catch(err => {
      loggers.fatal('url:/api-v1/send-media-url message: Error '+err);
      res.status(500).json({
        status: 500,
        message: err
      });
    });
  }

});
// Form Send message
app.post('/send-message', [
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/send-message message: Error '+Object.values(errors.mapped()));
    req.flash('errors',Object.values(errors.mapped()));
    res.redirect('/sendwa');
  }
  const sender = req.body.sender;
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;
  // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/send-message message: Client Not Found Please Create Account Whats Up And Scan Barcode ');
    req.flash('errors', 'Client Not Found Please Create Account Whats Up And Scan Barcode');
    res.redirect('/sendwa');
  }
  // const SESSION_FILE_PA THS = `/.wwebjs_auth/session-${sender}`;
  // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/send-message message: Please Scan Barcode Now In App');
  //   req.flash('errors', 'Please Scan Barcode Now In App');
  //   res.redirect('/sendwa');
  // }

  const client = sessions.find(sess => sess.id == sender).client;
  const isRegisteredNumber = await client.isRegisteredUser(number);
  // cek kalau nomor hp terdaftar di wa
  if (!isRegisteredNumber) {
    loggers.info('url:/send-message message: The number is not registered');
    req.flash('errors', 'The number is not registered');
    res.redirect('/sendwa');
  }
  if(isRegisteredNumber){
    client.sendMessage(number, message).then(response => {
      let Datapost = [{
        sender: sender, 
        number: number,
        message: message,
        desc: 'message',
        status: 'terkirim',
      }];

      console.log(response);
        loggers.debug('url:/send-message message: success send '+number);
        knex.transaction(function(trx) {
        knex('tbl_message').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          loggers.debug('url:/send-message message:Insert Send Wa Successfully '+resp);
          req.flash('success', 'Send Wa Successfully');
          res.redirect('/sendwa');
        }).catch(function(err) {
          console.log(err)
          loggers.error('url:/send-message message:Failed Insert Send Wa '+err);
        });
    }).catch(err => {
      req.flash('errors', err);
      loggers.fatal('url:/send-message message:errors '+err);
      res.redirect('/sendwa');
    });
  }
});

// Form Send media
app.post('/send-media',[
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('caption').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/send-media message: '+Object.values(errors.mapped()));
    req.flash('errors',Object.values(errors.mapped()));
    res.redirect('/sendwa');
  }
  if (!req.files || Object.keys(req.files).length === 0) {
    loggers.info('url:/send-media message:No files were uploaded ');
    req.flash('errors', 'No files were uploaded.');
    res.redirect('/sendwa');
  }
  const sender = req.body.sender;
  const caption = req.body.caption;
  const number = phoneNumberFormatter(req.body.number);
   // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/send-media message: Client Not Found Please Create Account Whats Up And Scan Barcode');
    req.flash('errors', 'Client Not Found Please Create Account Whats Up And Scan Barcode');
    res.redirect('/sendwa');
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/send-media message: Client Not Found Please Create Account Whats Up And Scan Barcode');
  //   req.flash('errors', 'Please Scan Barcode Now In App');
  //   res.redirect('/sendwa');
  // }
  const client = sessions.find(sess => sess.id == sender).client;
  const isRegisteredNumber = await client.isRegisteredUser(number);
  if (!isRegisteredNumber) {
    loggers.info('url:/send-media message: The number is not registered');
    req.flash('errors', 'The number is not registered');
    res.redirect('/sendwa');
  }
  if(isRegisteredNumber){
    const file = req.files.file;
    const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
    client.sendMessage(number, media, {
      caption: caption
    }).then(response => {
      let Datapost = [{
        sender: sender, 
        number: number,
        message: caption,
        desc: 'media',
        status: 'terkirim',
      }];
        loggers.debug('url:/send-media message: success send wa '+number);
        knex.transaction(function(trx) {
        knex('tbl_message').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          console.log(resp)
          loggers.debug('url:/send-media message:Insert Send Wa Media Successfully ');
          req.flash('success', 'Send Wa Media Successfully');
          res.redirect('/sendwa');
        }).catch(function(err) {
          console.log(err)
          loggers.error('url:/send-media message:'+err);
          req.flash('errors', err);
          res.redirect('/sendwa');
        });

    }).catch(err => {
      loggers.fatal('url:/send-media message:'+err);
      req.flash('errors', err);
      res.redirect('/sendwa');
    });
  }
});
app.post('/send-media-url',[
  body('sender').notEmpty(),
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });
  if (!errors.isEmpty()) {
    loggers.info('url:/send-media-url message:'+Object.values(errors.mapped()));
    req.flash('errors',Object.values(errors.mapped()));
    res.redirect('/sendwa');
  }
  
  const sender = req.body.sender;
  const caption = req.body.caption;
  const number = phoneNumberFormatter(req.body.number);
   // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/send-media-url message:Client Not Found Please Create Account Whats Up And Scan Barcode ');
    req.flash('errors', 'Client Not Found Please Create Account Whats Up And Scan Barcode');
    res.redirect('/sendwa');
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/send-media-url message:Client Not Found Please Create Account Whats Up And Scan Barcode ');
  //   req.flash('errors', 'Please Scan Barcode Now In App');
  //   res.redirect('/sendwa');
  // }
  const client = sessions.find(sess => sess.id == sender).client;
  const isRegisteredNumber = await client.isRegisteredUser(number);
  if (!isRegisteredNumber) {
    loggers.info('url:/send-media-url message:The number is not registered ');
    req.flash('errors', 'The number is not registered');
    res.redirect('/sendwa');
  }

  if(isRegisteredNumber){
    const fileUrl = req.body.file;
    let mimetype;
    const attachment = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    }).then(response => {
      mimetype = response.headers['content-type'];
      return response.data.toString('base64');
    });
    const media = new MessageMedia(mimetype, attachment, 'Media');

    client.sendMessage(number, media, {
      caption: caption
    }).then(response => {
      let Datapost = [{
        sender: sender, 
        number: number,
        message: caption,
        desc: 'media',
        status: 'terkirim',
      }];
        loggers.debug('url:/send-media-url message:success send wa '+number);
        knex.transaction(function(trx) {
        knex('tbl_message').transacting(trx).insert(Datapost)
            .then()
            .then(trx.commit)
            .catch(trx.rollback);
        }).then(function(resp) {
          console.log(resp)
          req.flash('success', 'Send Wa Media Successfully');
          loggers.debug('url:/send-media-url message: Insert Send Wa Media Successfully');
          res.redirect('/sendwa');
        }).catch(function(err) {
          console.log(err)
          loggers.error('url:/send-media-url message:Error Insert '+err);
          req.flash('errors', err);
          res.redirect('/sendwa');
        });

    }).catch(err => {
      loggers.fatal('url:/send-media-url message:'+err);
      req.flash('errors', err);
      res.redirect('/sendwa');
    });
  }
});
const findGroupByName = async function(name) {
  const group = await client.getChats().then(chats => {
    return chats.find(chat => 
      chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
}
// API Send message to group
app.post('/api-v1/send-group-message',[
  body('id').custom((value, { req }) => {
    if (!value && !req.body.name) {
      throw new Error('Invalid value, you can use `id` or `name`');
    }
    return true;
  }),
  // body('message').notEmpty(),
  body('sender').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    loggers.info('url:/api-v1/send-group-message message: '+errors.mapped());
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }
  let chatId = req.body.id;
  const sender = req.body.sender;
  const groupName = req.body.name;
  const caption = req.body.caption;

    // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/api-v1/send-group-message message: Client Not Found Please Create Account Whats Up And Scan Barcode');
    return res.status(422).json({
      status: 422,
      message: 'Client Not Found Please Create Account Whats Up And Scan Barcode'
    });
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/api-v1/send-group-message message: Please Scan Barcode Now In App');
  //   return res.status(422).json({
  //     status: 422,
  //     message: 'Please Scan Barcode Now In App'
  //   });
  // }
  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      loggers.info('url:/api-v1/send-group-message message: No group found with name:'+ groupName);
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }
  const client = sessions.find(sess => sess.id == sender).client;
  const fileUrl = req.body.file;
  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });
  const media = new MessageMedia(mimetype, attachment, 'Media');
  client.sendMessage(chatId, media, {
    caption: caption
  }).then(response => {
    loggers.debug('url:/api-v1/send-group-message message: Success send Groups:'+ chatId);
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    loggers.error('url:/api-v1/send-group-message message: Error send Groups:'+ chatId);
    res.status(500).json({
      status: false,
      response: err
    });
  });
});
app.post('/send-group-message-media-url',[
  body('id').custom((value, { req }) => {
    if (!value && !req.body.name) {
      throw new Error('Invalid value, you can use `id` or `name`');
    }
    return true;
  }),
  // body('message').notEmpty(),
  body('sender').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    loggers.info('url:/send-group-message-media-url message: Error send Groups:'+ errors.mapped());
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }
  let chatId = req.body.id;
  const sender = req.body.sender;
  const groupName = req.body.name;
  const caption = req.body.caption;

    // cek akun barcode
  if (!sessions.find(sess => sess.id == sender)) {
    loggers.info('url:/send-group-message-media-url message: Client Not Found Please Create Account Whats Up And Scan Barcode');
    req.flash('errors', 'Client Not Found Please Create Account Whats Up And Scan Barcode');
    res.redirect('/sendwa');
  }
  // const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  // // cek kalau belum scan barcode 
  // if (!fs.existsSync(SESSION_FILE_PATHS)) {
  //   loggers.info('url:/send-group-message-media-url message:Please Scan Barcode Now In App');
  //   req.flash('errors', 'Please Scan Barcode Now In App');
  //   res.redirect('/sendwa');
  // }
  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      loggers.info('url:/send-group-message-media-url message:No group found with name:'+ groupName);
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }
  const client = sessions.find(sess => sess.id == sender).client;
  const fileUrl = req.body.file;
  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });
  const media = new MessageMedia(mimetype, attachment, 'Media');
  client.sendMessage(chatId, media, {
    caption: caption
  }).then(response => {
    loggers.debug('url:/send-group-message-media-url message:Send Wa Group Media Url Successfully');
    req.flash('success', 'Send Wa Group Media Url Successfully');
    res.redirect('/sendwa');
  }).catch(err => {
    loggers.error('url:/send-group-message-media-url message:'+err);
    req.flash('errors', err);
    res.redirect('/sendwa');
  });
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const date = '2022-02-06 22:03';
schedule.scheduleJob(date, async function(){
  const sender = 'imamwasamwi';
  const number = phoneNumberFormatter('082165561175');
  const message = 'hallo imam';
  if (!sessions.find(sess => sess.id == sender)) {
    console.log('warning: ', 'Client Not Found Please Create Account Whats Up And Scan Barcode');
  }
  const SESSION_FILE_PATHS = `./public/filejson/whatsapp-session-${sender}.json`;
  if (!fs.existsSync(SESSION_FILE_PATHS)) {
      console.log('warning: ', 'Please Scan Barcode Now In App');
  }else{
    const client = sessions.find(sess => sess.id == sender).client;
    const isRegisteredNumber = await client.isRegisteredUser(number);
    if (!isRegisteredNumber) {
      console.log('warning: ', 'The number is not registered');
    }
    if(isRegisteredNumber){
      setTimeout(async() => {
        client.sendMessage(number, message).then(response => {
          console.log('success: ',true);
        }).catch(error => {
          console.log('error: ', error);
        });
      }, 1500);
    }
  }


});

module.exports = app;
