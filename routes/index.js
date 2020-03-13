var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');
var Common = require('../controller/common');

let jsonParser = bodyParser.json();

require('../models/user/user');
require('../models/magazine/magazine');
require('../models/magazine/mgzType');
require('../models/tradeRecord/record');

var Record = mongoose.model('record');
var User = mongoose.model('user');
var Magazine = mongoose.model('magazine');
var MgzType = mongoose.model('mgzType');


//获取banner杂志
router.get('/getBanner',function (req, res, next) {
  var limit =  5;//推荐的数量
  Magazine.find({putAway:true},{magazine:0})
      .sort({rank:-1})
      .limit(limit)
      .exec(function (err, data) {
        if(err)next(err);
          console.log('banner',data);
          res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});
//获取热门 top10 杂志
router.get('/getTop',function (req, res, next) {
  var limit =  10;//推荐的数量
  Magazine.find({putAway:true},{magazine:0})
      .sort({sold:-1})
      .limit(limit)
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});
//获取杂志类型
router.get('/getMgzType',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 6;
  page--;

  delete query['page'];
  delete query['limit'];

  MgzType.find(query)
      .sort({rank:-1})
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
//分页获取当前杂志，包括筛选
router.get('/getMagazine',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 6;
  page--;

  delete query['page'];
  delete query['limit'];

  if (query.name)query.name = {'$regex': query.name};

  Magazine.find(query,{magazine:0})
      .sort({rank:-1})
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
//获取杂志的购买排行榜
router.get('/rankingList',function (req, res, next) {
    var magazine = req.query.magazine;
    Record.aggregate(
        [
            {$match:{magazine:mongoose.Types.ObjectId(magazine)}},
            {$group : { _id : "$buyer", buyNum : {$sum :"$tradeCount"}}},
            {$sort:{buyNum:-1}}
        ])
        .lookup( { from: 'users', localField:'_id', foreignField:'_id', as:'user' } )
        .exec(function (err,doc) {
            // console.log(doc[0])
            res.jsonp({
                status:1,mess:'ok',
                data:doc
            })
        });
});

//登录接口  需要修改成微信登陆的 openid相关的接口~！！
router.post('/login',jsonParser,(req,res)=>{
  let openId = req.body.openId;

  User.findOne({openId:openId}).exec((err,data)=>{
    if (err) throw err;
    if (data){
      let content ={name:data.nickName,_id:data._id}; // 要生成token的主题信息
      let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
      let token = jwt.sign(content, secretOrPrivateKey, {
        expiresIn: 60*60*24  // 过期时间（秒）
      });
      //if (pass != data[0].pass){
      //  res.jsonp({status:2,mess:'密码错误'});
      //  return false;
      //}
      res.jsonp({status:1,mess:'ok',token:token})
    } else {
      //  新用户
        User.create(
            {
                nickName:'测试账号',//微信昵称
                headImg:'http://5b0988e595225.cdn.sohucs.com/images/20170724/ad28da0d658b43aba84ce91df9cacdad.jpeg',//微信头像
                province:'广东省',//省份
                city:'广州市',
                telephone:'13826272634',
                gender:'男',//性别

                //重要信息
                openId:openId,

            },
            function (err, doc) {
                let content ={name:doc.nickName,_id:doc._id}; // 要生成token的主题信息
                let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
                let token = jwt.sign(content, secretOrPrivateKey, {
                    expiresIn: 60*60*24  // 过期时间（秒）
                });
            res.jsonp({status:1,token:token,mess:'新建账号'});
        });
    }
  });
});
// //登录接口
router.get('/testlogin',jsonParser,(req,res)=>{
  let content ={name:'测试账号',test:'  var token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi6ZmI6aKWIiwidGVzdCI6MTIzMTIzLCJpYXQiOjE1NjY4MDk1ODIsImV4cCI6MTU2NjgxMzE4Mn0.Yhgb5aTKZXVUGsa8EJ4ZZHIh_3IDduL9i74Oss4Gmsc'}; // 要生成token的主题信息
  let secretOrPrivateKey="jwt";// 这是加密的key（密钥）
  let token = jwt.sign(content, secretOrPrivateKey, {
    expiresIn: 60*60*1  // 1小时过期
  });
  res.jsonp({status:1,mess:'ok',token:token,user_name:req.body.name})
});


// //后面的每次操作 用来判断token是否失效 或者过期
 router.get('/*',jsonParser,(req,res,next)=>{
   let token = req.get("Authorization"); // 从Authorization中获取token
   let secretOrPrivateKey = global.tokenKey; // 这是加密的key（密钥）
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
  try {
      var query = req.query
          ,magazine = query.magazine //杂志的id那些
          ,user = query.userInfo._id //用户id
          ,readCode = Common.getRandomCode(8)//生成8位阅读码
          ,tradeId = Common.getTradeNum();//生成订单号（时间戳+随机数）
      //创建新订单
      Record.create(
          {
              buyer:user,
              magazine:magazine,
              tradeId:tradeId,readCode:readCode,
              tradePrice:query.price,
              tradeCount:query.tradeCount,
              magazineInfo:{name:query.mgzName},
              tradeTime:new Date().valueOf()
          },
          function (err, data) {
              if(err)next(err);
              //返回订阅码
          Magazine.findOneAndUpdate({_id:magazine},{$inc:{sold:query.tradeCount}},function (err, doc) {}); // 增加销量
            res.jsonp({status:1,mess:'ok',readCode:readCode})
          }
      )

  }catch (e){
      console.log(e);
  }
});

//阅读杂志
router.get('/readMgz',function (req, res, next) {
  try {

  var query = req.query
      ,magazine = query.magazine
      ,user = query.userInfo._id
      ,readCode = query.readCode;
  var _query = {};


  if(!magazine){
      res.jsonp({status:40001,mess:'lack of info'});
      return false;
  }

  _query.magazine = magazine;
  if(readCode){ //有阅读码，优先查询阅读码，不然查询用户购买记录
    _query.readCode = readCode;
  }else{
    _query.buyer = user;
  }
      console.log(_query,'_query');
      Record.find(_query).sort({readCodeUsed:-1}).populate('magazine').exec(function (err, records) {
    if(err)next(err);
    if(records.length){
        console.log('找到阅读数据',records);
        // 找到阅读吗了,表示可以用户购买了这本书或者拥有阅读吗
        for(var i=0;i<records.length;i++){

            var data=records[i];
            if(data.user.indexOf(user) != -1){
                //  用户读过这本书（用户id在阅读吗使用过的数组中）
                res.jsonp({
                    status:1,mess:'ok',magazine:data.magazine
                });
                return false;
            }else {
                if(data.tradeCount > data.readCodeUsed){
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
                if( i >= records.length-1 ){
                    //无效阅读吗
                    res.jsonp({
                        status:40100,mess:'lack purchase'
                    });
                    return
                }

            }

        }
    }else {
    //    还没购买
        res.jsonp({
            status:40100,mess:'lack purchase'
        })
    }
  })
  }catch (e){
      console.log(e)
  }

});

//人员相关
router.get('/userInfo',function (req, res, next) {
  var user =req.query.userInfo;
  User.findOne({_id:user._id},function (err, user) {
    if(err)next(err);
    res.jsonp({
      status:1,mess:'ok',user:user
    })
  })
});
//查询已购信息
router.get('/userBuy',function (req, res, next) {
  var userId = req.query.userInfo._id;
  Record.find({buyer:userId})
      .populate('magazine')
      .exec(function (err,data) {
        if(err)next(err);
          console.log('userBuy',userId);
          res.jsonp({
          status:1,mess:'ok',data:data
        })
      })
});

router.get('/userRecord',function (req, res, next) {
  var userId = req.query.userInfo._id;
  Record.find({buyer:userId})
      .populate('magazine')
      .exec(function (err,data) {
        if(err)next(err);
          console.log('userRecord',data);
          res.jsonp({
          status:1,mess:'ok',data:data
        })
      })
});


module.exports = router;
