var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');

require('../models/user/user');
require('../models/magazine/magazine');
require('../models/magazine/mgzType');
require('../models/tradeRecord/record');
require('../models/admin/admin');

var Admin = mongoose.model('admin');
var Record = mongoose.model('record');
var User = mongoose.model('user');
var Magazine = mongoose.model('magazine');
var MgzType = mongoose.model('mgzType');

let jsonParser = bodyParser.json();

// new Admin({
//   userName:'admin',password:'123456'
// }).save();

//登录接口
router.post('/login',jsonParser,(req,res)=>{
  let name = req.body.username;
  let pass = req.body.password;
  console.log('login',name,+pass);
  Admin.find({userName:name}).exec((err,data)=>{
    if (err) throw err;
    if (data.length!=0){
      let content ={name:req.body.username}; // 要生成token的主题信息
      let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
      let token = jwt.sign(content, secretOrPrivateKey, {
        expiresIn: 60*60*24  // 24小时过期
      });
      if (pass != data[0].password){
        console.log('密码错误');
        res.json({status:2,mess:'密码错误'});
        return false;
      }
      console.log('登录成功');
      res.json({status:1,mess:'ok',token:token})
    } else {
      console.log('账户不存在');
      res.json({status:401,mess:'账户不存在'});
    }
  });
});

//后面的每次操作 用来判断token是否失效 或者过期
router.get('/*',jsonParser,(req,res,next)=>{
  let token = req.get("Authorization"); // 从Authorization中获取token
  // console.log('token',token);
  let secretOrPrivateKey = global.tokenKey; // 这是加密的key（密钥）
  jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
    if (err) {  //  时间失效的时候 || 伪造的token
      console.log('token 无效');
      // res.status(401);
      res.send({'status':10010,mess:"invalid token!"});
    } else {
      // console.log(decode);
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
    res.status(401);
    res.jsonp({
      status:'40001',
      mess:'lack magazines id'
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

//----------------------------杂志相关----------------------------
//上传杂志
router.post('/magazine',function (req,res,next) {
  var body = req.body;
  console.log('magazine',body);
  try {
    Magazine.create(body,function (err, doc) {
      if(err) {
        console.log(err)
        next(err);
      }
      res.jsonp({
        status:1,
        mess:'ok',
        data:doc
      })
    })
  }catch (e) {
    console.log(e)
  }
});
//分页获取杂志，包括筛选
router.get('/getMagazine',function (req, res, next) {
  var query = req.query;
  console.log(req.path,'的参数：',req.query)
  var page = query.page || 1,
      limit = query.limit || 10;
  page --;
  delete query['page'];
  delete query['limit'];

  Magazine.find(query)
      .sort({rank:-1})
      .skip(page*limit)
      .limit(limit)
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          magazine:data
        })
      })
});
router.get('/editMagazine',function (req, res, next) {
  var query = req.query;
  console.log(req.path,'的参数：',req.query)
  Magazine.findOneAndUpdate({_id:query._id},
      {
        name:query.name,
        subTitle:query.subTitle,//副标题
        describe:query.describe,//述描;
        type:query.type,//类型,可多个
        subHeadImg:query.subHeadImg,//详情页的封面图，可以多张
        magazine:query.magazine,//内容图片链接，多张
        sold:query.sold,//销售数量
        price:query.price,//定价
        rank:query.rank,//排序权重 ，越高越靠前，默认是0 （可用作首页显示）
        putAway:query.putAway//是否上架
      },
      function (err, data) {
    if(err)next(err);
    res.jsonp({
      status:1,mess:'ok'
    })
  })
});
router.get('/delMagazine',function (req, res, next) {
  console.log(req.path,'的参数：',req.query)
  var query = req.query;

  Magazine.deleteOne({_id:query._id},function (err, data) {
    if(err)next(err);
    res.jsonp({
      status:1,mess:'ok'
    })
  })
});

//----------------------------杂志相关 end ----------------------------


//---------------------------------------用户相关================================
//分页获取 用户信息
router.get('/getUser',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 10;
  page --;
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
router.get('/editUser',function (req, res, next) {
  var query = req.query;
  console.log(req.path,'的参数：',req.query)
  User.findOneAndUpdate({_id:query._id},
      {
        vipLevel:query.vipLevel,//会员等级，0是没有，1是普通会员，2高级会员~
        allRecharge:query.allRecharge,//总共充值金额
      },
      function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok'
        })
      })
});

//---------------------------------------用户相关 end================================


//分页获取 交易记录
router.get('/getRecord',function (req, res, next) {
  var query = req.query;
  var page = query.page || 1,
      limit = query.limit || 10;

  delete query['page'];
  delete query['limit'];
  page --;

  Record.find(query)
      .sort({_id:-1})
      .skip(page*limit)
      .limit(limit)
      .populate('buyer')
      .exec(function (err, data) {
        if(err)next(err);
        res.jsonp({
          status:1,mess:'ok',
          data:data
        })
      })
});

////----------------------杂志类型相关----------------------
router.post('/addMgzType',function (req,res,next) {
  var body = req.body;
  console.log('MgzType',body);
  try {
    MgzType.create(body,function (err, doc) {
      if(err) {
        console.log(err)
        next(err);
      }
      res.jsonp({
        status:1,
        mess:'ok',
        data:doc
      })
    })
  }catch (e) {
    console.log(e)
  }
});
router.get('/getMgzType',function (req, res, next) {
  var query = req.body;
  var page = query.page || 1,
      limit = query.limit || 10;
  page --;

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
router.get('/editMgzType',function (req, res, next) {
  var query = req.query;

  MgzType.findOneAndUpdate({_id:query._id},{name:query.name,rank:query.rank},function (err, data) {
    if(err)next(err);
    console.log(data.name,'修改的东西');
    Magazine.updateMany({type:data.name},{$set:{"type.$":query.name}},function (err, up) {
      if(err)next(err);
      res.jsonp({
        status:1,mess:'ok'
      })
    })
  })
});
router.get('/delMgzType',function (req, res, next) {
  var query = req.query;

  MgzType.deleteOne({_id:query._id},function (err, data) {
    if(err)next(err);
    res.jsonp({
      status:1,mess:'ok'
    })
  })
});
//----------------------杂志类型结束--------------------------------------------


module.exports = router;
