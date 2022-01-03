var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
const cors = require('cors');
var mongoose = require('mongoose');
const bodyParser = require("body-parser");
const wxchat = require('./utils/wechat')
require("body-parser-xml")(bodyParser);//微信支付解析xml
// var session = require('express-session');
// var mongoStore = require('connect-mongo')(session);
const easyMonitor = require('easy-monitor');
easyMonitor('Planet杂志');
// const nmProfiler = require('nmProfiler-master');//引入监控程序
// nmProfiler({
//   project_name: '编程侠', // 你项目名称
//   embrace: {
//     tcp_host: '127.0.0.1', // Node-Monitor部署的地址
//     tcp_port: 30000  // Node-Monitor tcp服务的端口
//   }
// })

var indexRouter = require('./routes/index');
var purchase = require('./routes/purchase');
var admin = require('./routes/admin');
var usersRouter = require('./routes/users');

global.tokenKey = 'magazine';//token加密的秘钥
global.appid = 'wx2ac6c463e7b2c49e'; //小程序appid
global.appsecret = '44c7a51463adc560147fc4cb20431db9';//小程序密钥
global.mch_id = '1587531981';//微信支付商户号
global.mch_key = 'Planetofficialmagazinedivus09011';//微信支付商户秘钥
global.webappid = 'wxb373346dd4ebbb8a'; //服务号appid
global.websecret = 'fc356bf79b856d59171c3b16e43ee709';//服务号密钥 cb5ac6c53c0a90b038d323709547c622



var app = express();
//解析微信支付
app.use(bodyParser.xml({
  limit: "1MB",
  xmlParseOptions: {
    normalize: true,
    normalizeTags: true,
    explicitArray: false
  },
  verify: function(req, res, buf, encoding) {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || "utf8");
    }
  }
}));

var dbUrl = 'mongodb://localhost:27017/magazine';
mongoose.connect(dbUrl,{ useNewUrlParser: true },function (err) {
  if(err){
    console.log('error',err)
  }
  console.log('--------------------------链接数据库成功-----------------------')
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

app.use('/client', indexRouter);
app.use('/client', purchase);
app.use('/admin', admin);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  let timestrap = new Date().valueOf();
  console.log('错误数据.',req.path);
  if(err.status !== 404){
    fs.writeFile('./errors/'+timestrap+'.txt',JSON.stringify(err.message)+'\r\n path:'+req.path, { 'flag': 'a' }, function(err) {
      console.log('已经记录错误数据.');
    });
  }
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.jsonp({
    status:500,mess:'server error'
  });
});

wxchat.get_wx_accesstoken();//微信自动更新accesstoken
module.exports = app;
