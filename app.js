var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
var mongoose = require('mongoose');
// var session = require('express-session');
// var mongoStore = require('connect-mongo')(session);

var indexRouter = require('./routes/index');
var admin = require('./routes/admin');
var usersRouter = require('./routes/users');

global.tokenKey = 'magazine';//token加密的秘钥

var app = express();

var dbUrl = 'mongodb://localhost:27017/magazine';
mongoose.connect(dbUrl,{ useNewUrlParser: true },function (err) {
  if(err){
    console.log('error',err)
  }
});
mongoose.connection.on('open',function (err) {
  console.log('lecture db connect success! ');
});

app.use(cors());//允许跨域

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', admin);

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
  res.jsonp({
    status:500,mess:'server error'
  });
});

module.exports = app;
