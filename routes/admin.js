var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');

require('../models/user/user');
require('../models/magazine/magazine');
require('../models/tradeRecord/record');
require('../models/admin/admin');

var Admin = mongoose.model('admin');
var Record = mongoose.model('record');
var User = mongoose.model('user');
var Magazine = mongoose.model('magazine');

let jsonParser = bodyParser.json();


//登录接口
router.post('/login',jsonParser,(req,res)=>{
  let name = req.body.name;
  let pass = req.body.pass;
  Admin.find({name:name}).exec((err,data)=>{
    if (err) throw err;
    if (data.length!=0){
      let content ={name:req.body.name}; // 要生成token的主题信息
      let secretOrPrivateKey = global.toeknKey;// 这是加密的key（密钥）
      let token = jwt.sign(content, secretOrPrivateKey, {
        expiresIn: 60*60*1  // 1小时过期
      });
      if (pass != data[0].pass){
        res.json({status:2,mess:'密码错误'});
        return false;
      }
      res.json({status:1,mess:'ok',token:token})
    } else {
      res.json({status:401,mess:'账户不存在'});
    }
  });
});

//后面的每次操作 用来判断token是否失效 或者过期
router.get('/*',jsonParser,(req,res)=>{
  let token = req.get("Authorization"); // 从Authorization中获取token
  let secretOrPrivateKey = global.toeknKey; // 这是加密的key（密钥）
  jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
    if (err) {  //  时间失效的时候 || 伪造的token
      res.send({'status':10010,mess:"invalid token!"});
    } else {
      next();
    }
  })
});
//-----------------------------上传图片部分
var urlProducts = './public/images/magazines/';
var storageProductions = multer.diskStorage({
  destination: function (req, file, cb) {
    var magazineNum = req.get('magazineNum');
    var path = urlProducts +  magazineNum + '/';
    //检查目录，不存在则新建目录文件夹
    fs.exists( path,function(exists){
      if(!exists){
        console.log("创建新文件夹",magazineNum);
        fs.mkdir(path,function(err){
          cb(null,path );
        });
      }else {
        cb(null,path );
      }
    });
  },
  filename: function (req, file, cb) {
    // 将保存文件名设置为 学号 + 时间戳，比如 学生学号-1478521468943
    _name = file.originalname;
    nameArray = _name.split('');
    var nameMime = [];
    l = nameArray.pop();
    nameMime.unshift(l);
    while (nameArray.length != 0 && l != '.') {
      l = nameArray.pop();
      nameMime.unshift(l);
    }
    //_name.replace(/\W+/g, '-').toLowerCase()
//Mime是文件的后缀
    Mime = nameMime.join('');
    cb(null, _name.replace(/\W+/g, '-').toLowerCase() + '-' + Date.now() + Mime);
  }
});
var uploadProductions = multer({ storage:storageProductions });
//--------------上传图片
router.post('/magazineImg',function (req, res, next) {
var magazineNum = req.get('magazineNum');
  console.log('magazineNum',magazineNum);
  if(!magazineNum){//上传图片必须带有参数magazineNum 否则不予上传
    res.jsonp({
      status:'40001',
      mess:'lack magazine id'
    });
    return false;
  }else {
    next();
  }
});
router.post('/magazineImg', uploadProductions.single('fileName'), function (req, res, next) {
  //接收并保存图片
  console.log('开始保存照片')
  next();
});
router.post('/magazineImg', function (req, res, next) {
  var file = req.file,body = req.body,productions= body;
  if(file)productions.fileName = file.filename;
  res.jsonp({
    status:1,
    mess:'ok',
    data:productions  //返回上传后的文件名
  });
});
//-----------------------------上传内容图片部分end

//分页获取当前杂志，包括筛选
router.get('/getMagazine',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 10;

  delete query['page'];
  delete query['limit'];

  Magazine.find(query)
      .sort({_id:-1})
      .skip(page*limit)
      .limit(limit)
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});
//分页获取 用户信息
router.get('/getUser',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 10;

  delete query['page'];
  delete query['limit'];

  User.find(query)
      .sort({_id:-1})
      .skip(page*limit)
      .limit(limit)
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});
//分页获取 交易记录
router.get('/getRecord',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 10;

  delete query['page'];
  delete query['limit'];

  Record.find(query)
      .sort({_id:-1})
      .skip(page*limit)
      .limit(limit)
      .populate('user')
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});


module.exports = router;
