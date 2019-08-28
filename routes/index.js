var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token

let jsonParser = bodyParser.json();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//登录接口
router.get('/login',jsonParser,(req,res)=>{
  let content ={name:'陈颖',test:'  var token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi6ZmI6aKWIiwidGVzdCI6MTIzMTIzLCJpYXQiOjE1NjY4MDk1ODIsImV4cCI6MTU2NjgxMzE4Mn0.Yhgb5aTKZXVUGsa8EJ4ZZHIh_3IDduL9i74Oss4Gmsc'}; // 要生成token的主题信息
  let secretOrPrivateKey="jwt";// 这是加密的key（密钥）
  let token = jwt.sign(content, secretOrPrivateKey, {
    expiresIn: 60*60*1  // 1小时过期
  });
  res.json({status:1,mess:'ok',token:token,user_name:req.body.name})
});

//每次切换都去调用此接口 用来判断token是否失效 或者过期
router.get('/checkUser',jsonParser,(req,res)=>{
  // let token = req.get("Authorization"); // 从Authorization中获取token
  var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi6ZmI6aKWIiwidGVzdCI6IiAgdmFyIHRva2VuID0gZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnVZVzFsSWpvaTZabUk2YUtXSWl3aWRHVnpkQ0k2TVRJek1USXpMQ0pwWVhRaU9qRTFOalk0TURrMU9ESXNJbVY0Y0NJNk1UVTJOamd4TXpFNE1uMC5ZaGdiNWFUS1pYVlVHc2E4RUo0WlpISWhfM0lEZHVMOWk3NE9zczRHbXNjIiwiaWF0IjoxNTY2OTY0MTA1LCJleHAiOjE1NjY5Njc3MDV9.Inez-yv3AwGYGBgvAUQ5Qby-NoMnI0zacZvApuOXkaA'
  let secretOrPrivateKey="jwt"; // 这是加密的key（密钥）
  jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
    if (err) {  //  时间失效的时候 || 伪造的token
      res.send({'status':10010});
    } else {
      res.send({'status':10000,'decode':decode});
    }
  })
});


module.exports = router;
