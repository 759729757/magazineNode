var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');

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
        res.json({status:2,mess:'密码错误'});
        return false;
      }
      res.json({status:1,mess:'ok',token:token})
    } else {
      res.json({status:401,mess:'账户不存在'});
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
  res.json({status:1,mess:'ok',token:token,user_name:req.body.name})
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
router.get('/purchase',function (req, res) {
   var query = req.query
       ,magazine = query.magazine
       ,user = query.userInfo._id
       ,;

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
