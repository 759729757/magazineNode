var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');
var Common = require('../controller/common');

let jsonParser = bodyParser.json();

require('../models/user/user');
require('../models/magazine/magazine');
require('../models/tradeRecord/record');

var Record = mongoose.model('record');
var User = mongoose.model('user');
var Magazine = mongoose.model('magazine');


//分页获取推荐杂志
router.get('/getRecommend',function (req, res, next) {
  var limit =  6;//推荐的数量

  Magazine.find()
      .sort({rank:-1,_id:-1})
      .limit(limit)
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});

//分页获取当前杂志，包括筛选
router.get('/getMagazine',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 6;

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

//登录接口  需要修改成微信登陆的 openid相关的接口~！！
router.post('/login',jsonParser,(req,res)=>{
  let openId = req.body.openId;
  let pass = req.body.pass;
  User.find({openId:openId}).exec((err,data)=>{
    if (err) throw err;
    if (data.length!=0){
      let content ={name:req.body.name}; // 要生成token的主题信息
      let secretOrPrivateKey = global.toeknKey;// 这是加密的key（密钥）
      let token = jwt.sign(content, secretOrPrivateKey, {
        expiresIn: 60*60*1  // 1小时过期
      });
      if (pass != data[0].pass){
        res.jsonp({status:2,mess:'密码错误'});
        return false;
      }
      res.jsonp({status:1,mess:'ok',token:token})
    } else {
      res.jsonp({status:401,mess:'账户不存在'});
    }
  });
});
// //登录接口
router.get('/testlogin',jsonParser,(req,res)=>{
  let content ={name:'陈颖',test:'  var token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi6ZmI6aKWIiwidGVzdCI6MTIzMTIzLCJpYXQiOjE1NjY4MDk1ODIsImV4cCI6MTU2NjgxMzE4Mn0.Yhgb5aTKZXVUGsa8EJ4ZZHIh_3IDduL9i74Oss4Gmsc'}; // 要生成token的主题信息
  let secretOrPrivateKey="jwt";// 这是加密的key（密钥）
  let token = jwt.sign(content, secretOrPrivateKey, {
    expiresIn: 60*60*1  // 1小时过期
  });
  res.jsonp({status:1,mess:'ok',token:token,user_name:req.body.name})
});


//后面的每次操作 用来判断token是否失效 或者过期
router.get('/*',jsonParser,(req,res,next)=>{
  let token = req.get("Authorization"); // 从Authorization中获取token
  let secretOrPrivateKey = global.toeknKey; // 这是加密的key（密钥）
  jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
    if (err) {  //  时间失效的时候 || 伪造的token
      res.send({'status':10010,mess:"invalid token!"});
    } else {
      req.query.userInfo = decode;//记录解析出来的数据
      next();
    }
  })
});
//购买杂志 前端确认支付后，生成该书阅读码返回前端
router.get('/purchase',function (req, res,next) {
   var query = req.query
       ,magazine = query.magazine //杂志的信息，包括id那些
       ,user = query.userInfo._id //用户id
       ,readCode = Common.getRandomCode(8)//生成8位阅读码
       ,tradeId = Common.getTradeNum();//生成订单号（时间戳+随机数）
  //创建新订单
  Record.create(
      {
        buyer:user,magazine:magazine._id,magazineInfo:magazine,tradePride:query.pride,tradeNum:tradeNum,
        tradeTime:new Date().valueOf(),tradeId:tradeId,readCode:readCode
      },
      function (err, data) {
        if(err)next(err);
        //返回订阅码
        res.jsonp({status:1,mess:'ok',readCode:readCode})
      }
  )
});
//阅读杂志
router.get('/readMgz',function (req, res, next) {
  var query = req.query
      ,magazine = query.magazine._id
      ,user = query.userInfo._id
      ,readCode = query.readCode;
  var _query = {};

  if(!magazine)res({status:40001,mess:'lack of info'});
  _query.magazine = magazine;
  if(readCode){
    _query.readCode = readCode;
  }else{
    _query.buyer = user;
  }

  Record.findOne(_query).sort({readCodeUsed:-1}).populate('magazine').exec(function (err, data) {
    if(err)next(err);
    if(data){
    // 找到阅读吗了,表示可以用户购买了这本书或者拥有阅读吗
      if(data.user.indexOf(user) != -1){
      //  用户读过这本书（用户id在阅读吗使用过的数组中）
        res.jsonp({
          status:1,mess:'ok',magazine:data.magazine
        })
      }else {
        //记录用户阅读历史，然后把杂志信息返回前端
        Record.useRecord(magazine,data.readCode,user,function (err, data) {
          if(err)next(err);
          Magazine.findOne({_id:magazine},function (err, data) {
            if(err)next(err);
            res.jsonp({
              status:1,mess:'ok',magazine:data
            })
          })
        })
      }
    }
  })
});







//每次切换都去调用此接口 用来判断token是否失效 或者过期
router.get('/checkUser',jsonParser,(req,res,next)=>{
  // let token = req.get("Authorization"); // 从Authorization中获取token
  var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi6ZmI6aKWIiwidGVzdCI6IiAgdmFyIHRva2VuID0gZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnVZVzFsSWpvaTZabUk2YUtXSWl3aWRHVnpkQ0k2TVRJek1USXpMQ0pwWVhRaU9qRTFOalk0TURrMU9ESXNJbVY0Y0NJNk1UVTJOamd4TXpFNE1uMC5ZaGdiNWFUS1pYVlVHc2E4RUo0WlpISWhfM0lEZHVMOWk3NE9zczRHbXNjIiwiaWF0IjoxNTY3MTUyMzg5LCJleHAiOjE1NjcxNTU5ODl9.owHIc6QBgj2Wfb8qv0zoJOeUDtQncf53Ej62Hgv-1Yw'
  let secretOrPrivateKey="jwt"; // 这是加密的key（密钥）
  jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
    if (err) {  //  时间失效的时候 || 伪造的token
      res.send({'status':10010});
    } else {
      console.log(decode);
      req.query.token = decode;
      res.send({'status':10000,'decode':decode});
    }
  })
});

module.exports = router;
