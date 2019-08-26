var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');

require('../models/user/user');

var User = mongoose.model('user');

let jsonParser = bodyParser.json();


//登录接口
app.post('/login',jsonParser,(req,res)=>{
  let name = req.body.name;
  let pass = req.body.pass;
  User.find({name:name}).exec((err,data)=>{
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


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
