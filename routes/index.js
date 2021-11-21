var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
var mongoose = require('mongoose');
var fs = require('fs');
var Common = require('../controller/common');
const https= require('https');
require("body-parser-xml")(bodyParser);//微信支付解析xml
var wxSign = require('../utils/sign');

let jsonParser = bodyParser.json();

require('../models/user/user');
require('../models/magazine/magazine');
require('../models/magazine/mgzType');
require('../models/tradeRecord/record');
require('../models/user/address');

var Record = mongoose.model('record');
var User = mongoose.model('user');
var Magazine = mongoose.model('magazine');
var MgzType = mongoose.model('mgzType');
var Address = mongoose.model('address');


//获取banner杂志
router.get('/getBanner', function (req, res, next) {
    var limit =  10;//推荐的数量
    Magazine.find({putAway:true},{magazine:0})
        .sort({rank:-1})
        .limit(3)
        .exec(function (err, top1) {
            if(err)next(err);
            Magazine.find({putAway:true},{magazine:0})
                .sort({sold:-1})
                .limit(limit)
                .exec(function (err, top10) {
                    var _top10 = top10.filter(item => {
                        // return item._id !== top1[0]._id;
                        var isNew = true;
                        for(var i=0;i<top1.length;i++){
                            if(item._id === top1[i]._id){
                                isNew = false;
                            }
                        }
                        return isNew;
                    });
                    res.jsonp({
                        status:1,mess:'ok',
                        data:top1.concat(_top10)
                    })
                });
        });
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
    if(!query.putAway)query.putAway = true;



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
    try {
        Magazine.findOne({_id:magazine}).exec(function (err,data) {

            Record.aggregate(
                [
                    {$match:{magazine:mongoose.Types.ObjectId(magazine),isPay:true,coupon:{$ne:true}}},
                    {$group : { _id : "$buyer", buyNum : {$sum :"$tradeCount"}}},
                    {$sort:{buyNum:-1}}
                ])
                .limit(10)
                .lookup( { from: 'users', localField:'_id', foreignField:'_id', as:'user' } )
                .exec(function (err,doc) {
                    if(data.showRankingWeek){
                        var startTime = new Date('2021-03-06 12:00').valueOf();
                        var endTime = new Date('2021-03-13 23:59').valueOf();
                        try {
                            Record.aggregate(
                                [
                                    {
                                        $match:{
                                            magazine:mongoose.Types.ObjectId(magazine),
                                            isPay:true,
                                            coupon:{$ne:true},
                                            tradeTime:{$gte:String(startTime),$lte:String(endTime)}
                                        }
                                    },
                                    {$group : { _id : "$buyer", buyNum : {$sum :"$tradeCount"}}},
                                    {$sort:{buyNum:-1}}
                                ])
                                .limit(10)
                                .lookup( { from: 'users', localField:'_id', foreignField:'_id', as:'user' } )
                                .exec(function (e,doc2) {
                                    if(new  Date().valueOf() < startTime){
                                        doc2 = doc;
                                    }
                                    res.jsonp({
                                        status:1,mess:'ok',
                                        data:doc,
                                        rankingListWeek:doc2,
                                    })
                                })
                        }catch (e) {
                            res.jsonp({
                                status:1,mess:'ok',
                                data:doc,
                                rankingListWeek:doc,
                            })
                        }
                    }else{
                        res.jsonp({
                            status:1,mess:'ok',
                            data:doc
                        })
                    }

                });

        })
    }catch (e) {
        console.log('rankingList');
        res.jsonp({
            status:0,mess:'err',
            data:[]
        })
    }
});

router.get('/getUserInfoByWechat',function (req,res,next) {
    var openid = req.query.openid,
        access_token = req.query.access_token;

    https.get("https://api.weixin.qq.com/sns/userinfo?access_token="+
        access_token+"&openid="+openid+"&lang=zh_CN",
        function (res1) {
            res1.on('data', function (d) {
                let userInfo = JSON.parse(d.toString());
                console.log('用户数据', userInfo);
                User.findOneAndUpdate({wxopenid:openid},
                    {userInfo:userInfo,avatarUrl:userInfo.headimgurl,nickName:userInfo.nickname},function (err,doc) {
                        if(err) res.jsonp({status: -1, mess: 'error,try again'});
                        res.jsonp({
                            status: 1, mess: 'ok', userInfo: userInfo
                        })
                    })
            })
        }).on('error', function (e) {
        console.log("获取微信信息失败: " + e.message);
        res.jsonp({status: -1, mess: 'error,try again'});
    });
})

// 小程序id
router.get('/loginByCode',function (req, res, next) {
    console.log('wx_appid',global.appid+'secret',global.appsecret)
    var code = req.query.code || false;
    var state = req.query.state || false;
    if (!code){
        res.jsonp({
            status:40001,mess:'缺少必要字段'//缺了code
        });return false;//filtration invalid request
    }
    if(code){
        try {
            var x='';//wx response;

            if (state === 'web') {
                var appid = global.webappid; //公众号appid
                var secret = global.websecret; //公众号 secret key
                https.get("https://api.weixin.qq.com/sns/oauth2/access_token?appid="
                    + appid + "&secret=" + secret + "&code=" + code + "&grant_type=authorization_code",
                    function (res1) {
                        res1.on('data', function (d) {
                            x = JSON.parse(d.toString());
                            var openid = x.openid,access_token = x.access_token;
                            console.log('微信登录 用户数据', x);
                            if (openid != undefined) {
                                //微信服务号的openid字段为wxopenid
                                User.findOne({wxopenid: openid}, function (err, user) {
                                    if (err) res.jsonp({status: -1, mess: 'tyr again'});
                                    // console.log('get wx info:',user);
                                    if (user) {
                                        let content = {
                                            openid: openid,
                                            _id: user._id,
                                            session_key: x.session_key,
                                            access_token: x.access_token
                                        }; // 要生成token的主题信息
                                        let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
                                        let token = jwt.sign(content, secretOrPrivateKey, {
                                            expiresIn: 60 * 60 * 4  // 4小时过期
                                        });
                                        res.jsonp({
                                            status: 1, mess: 'ok',
                                            openid:openid,
                                            access_token:access_token,
                                            token: token,
                                            user: user
                                        }) //返回token
                                    } else {
                                        //首次登陆，自动注册用户
                                        User.create({
                                            wxopenid: openid, creat_date: new Date().toLocaleString()
                                        }, function (err, doc) {
                                            if (err) res.jsonp({status: -1, mess: 'tyr again'});
                                            let content = {
                                                openid: openid,
                                                _id: doc._id,
                                                session_key: x.session_key,
                                                access_token: x.access_token
                                            }; // 要生成token的主题信息
                                            let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
                                            let token = jwt.sign(content, secretOrPrivateKey, {
                                                expiresIn: 60 * 60 * 4  // 4小时过期
                                            });
                                            res.jsonp({status: 1, mess: 'register ok',openid:openid,access_token:access_token, token: token, user: doc}) //返回token
                                        });
                                    }
                                });

                            } else {
                                //did not get openid;
                                console.log("获取不到openid :" + x.errcode);
                                res.jsonp({status: -1, mess: 'no openid'});
                                return false;
                            }
                        })
                    }).on('error', function (e) {
                    //https get fail;
                    console.log("微信登陆失败: " + e.message);
                    res.redirect("login.html");
                });
            }else{
                https.get("https://api.weixin.qq.com/sns/jscode2session?appid="
                    + global.appid+"&secret="+global.appsecret+"&js_code="+code
                    +"&grant_type=authorization_code",
                    function(res1) {
                        res1.on('data',function(d){
                            x = JSON.parse(d.toString());
                            var openid = x.openid;
                            // console.log('user info:'+ x.toString(),openid);
                            if(openid!=undefined){
                                //get openid success!
                                User.findOne({openId:openid}, function (err, user) {
                                    if (err)next(err);
                                    // console.log('get wx info:',user);
                                    if(user){
                                        let content = {openid:openid,_id:user._id}; // 要生成token的主题信息
                                        let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
                                        let token = jwt.sign(content, secretOrPrivateKey, {
                                            expiresIn: 60*60*4  // 4小时过期
                                        });
                                        res.jsonp({status:1,mess:'ok',token:token,user:user}) //返回token
                                    }else {
                                        //首次登陆，自动注册用户
                                        User.create({
                                            openId:openid
                                        },function (err, doc) {
                                            let content = {openid:openid,_id:doc._id}; // 要生成token的主题信息
                                            let secretOrPrivateKey = global.tokenKey;// 这是加密的key（密钥）
                                            let token = jwt.sign(content, secretOrPrivateKey, {
                                                expiresIn: 60*60*4  // 4小时过期
                                            });
                                            res.jsonp({status:1,mess:'register ok',token:token,user:doc}) //返回token
                                        });
                                    }
                                });
                            }else{
                                //did not get openid;
                                console.log("获取不到openid :"+ x.errcode);
                                res.jsonp({status:-1,mess:'no openid'});
                                return false;
                            }
                        })
                    }).on('error', function(e) {
                    //https get fail;
                    console.log("微信登陆失败: " + e.message);
                    res.jsonp({status:-1,mess:'error,try again'});
                });
            }


        }catch (e) {
            console.log(e)
        }

    }
});

router.get('/wechatConfig',function (req,res,next) {
    var url = req.query.url;
    try {
        if (url) {
            console.log('wx_sign:' + wxSign(global.jsapi_ticket, url));
            res.jsonp(wxSign(global.jsapi_ticket, url));
        } else {
            res.jsonp('false');
        }
    } catch (e) {
        console.log('config出错：', e);
        res.jsonp('false');
    }
})
//微信回调地址
router.post('/purchaseCallback',function (req, res, next) {
    console.log('微信支付回调：',req.body);

    try {
        //修改订单状态
        var query = req.body.xml;
        if(query.result_code[0] == 'SUCCESS'){
            console.log('-------------------已经收到微信支付成功回调！-------------.');
            Record.findOneAndUpdate(
                {tradeId:query.out_trade_no[0]},
                {
                    isPay:true
                },
                function (err, data) {
                    if(err)next(err);
                    //返回订阅码
                    Magazine.findOneAndUpdate({_id:data.magazine},{$inc:{sold:data.tradeCount}},function (err, doc) {}); // 增加销量
                }
            );
            var resolve = "<xml>" +
                "<return_code><![CDATA[SUCCESS]]></return_code>" +
                "<return_msg><![CDATA[OK]]></return_msg>" +
                "</xml> ";
            res.header('Content-Type', 'text/xml' );
            res.end(resolve);
        }else {
            res.end(400);

        }
    }catch (e){
        console.log(e);
        res.end(400);
    }


});

// //后面的每次操作 用来判断token是否失效 或者过期
router.get('/*',jsonParser,(req,res,next)=>{
    let token = req.get("Authorization"); // 从Authorization中获取token
    let secretOrPrivateKey = global.tokenKey; // 这是加密的key（密钥）
    jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
        if (err) {  //  时间失效的时候 || 伪造的token
            res.send({'status':0,mess:"登录超时，请重新进入小程序"});
        } else {
            req.query.userInfo = decode;//记录解析出来的数据
            next();
        }
    })
});
router.post('/*',jsonParser,(req,res,next)=>{
    let token = req.get("Authorization"); // 从Authorization中获取token
    let secretOrPrivateKey = global.tokenKey; // 这是加密的key（密钥）
    jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
        if (err) {  //  时间失效的时候 || 伪造的token
            res.send({'status':10010,mess:"invalid token!"});
        } else {
            req.body.userInfo = decode;//记录解析出来的数据
            next();
        }
    })
});

router.post('/updateUserInfo',function (req, res,next) {
    var body = req.body;
    console.log('updateUserInfo',body.nickName);
    User.findOneAndUpdate(
        {openId:body.userInfo.openid},
        {
            avatarUrl: body.avatarUrl,
            city: body.city,
            gender: body.gender,
            nickName: body.nickName,
            province: body.province,
            systemInfo:body.systemInfo
        },
        function (err, doc) {
            res.jsonp({status:1,mess:'ok',data:doc})
        })

});

// 更新用户收货地址
router.post('/updateUserAddress',function (req, res,next) {
    var body = req.body;
    var openid = body.userInfo.openid;
    try{
        Address.findOne({user: openid}, function(err, address){
            if(!address){
                Address.create(
                    {
                        user:openid,
                        userName: body.userName,
                        phoneNumber: body.phoneNumber,
                        prov: body.prov,
                        city: body.city,
                        district: body.district,
                        address:body.address
                    },
                    function (err, doc) {
                        err && console.log('添加失败', err);
                        res.jsonp({status:1,mess:'ok',data:doc})
                    })
    
            }else{
                Address.findOneAndUpdate(
                    {user:openid},
                    {
                        userName: body.userName,
                        phoneNumber: body.phoneNumber,
                        prov: body.prov,
                        city: body.city,
                        district: body.district,
                        address:body.address
                    },
                    {
                        upsert: true
                    },
                    function (err, doc) {
                        res.jsonp({status:1,mess:'ok',data:doc})
                    })
            }
        });
    }catch(err){
        err && console.log('更新地址错误', err)
        res.jsonp({
            status:0,
            mess:'err'
        })
    }
});
// 查询用户地址
router.get('/userAddress', function(req, res, next){
    try{
        var body = req.query;
        var openid = body.userInfo.openid;
        Address.findOne({user: openid}, function(err, doc){
            err && console.log('获取用户地址错误', err);
            res.jsonp({
                status: 1,
                data: doc
            })
        })

    }catch(e){
        console.log('查询失败', e);
    }
})
//查询已购信息
router.get('/userBuy',function (req, res, next) {
    var token = req.query.token;
    let secretOrPrivateKey = global.tokenKey; // 这是加密的key（密钥）
    if(!token && !req.query.userInfo._id){
        res.jsonp({
            status:0,mess:'请重新登录'
        })
    }
    jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
        if (err) {
            res.jsonp({
                status:0,mess:'请重新登录'
            })
        //  兼容旧版
        //     let userId2 = req.query.userInfo._id;
        //     Record.find({buyer:mongoose.Types.ObjectId(userId2),isPay:true})
        //         .populate('magazine')
        //         .exec(function (err,data) {
        //             if(err)next(err);
        //             console.log('userBuy',userId2);
        //             res.jsonp({
        //                 status:1,mess:'ok',data:data,userId:userId2
        //             })
        //         })
        } else {
            let userId = decode._id;
            Record.find({buyer:mongoose.Types.ObjectId(userId),isPay:true})
                .populate('magazine')
                .exec(function (err,data) {
                    if(err)next(err);
                    console.log('用户购买数据:',userId);
                    res.jsonp({
                        status:1,mess:'ok',data:data,userId:userId
                    })
                })
        }
    });
});
router.get('/userRecord',function (req, res, next) {
    var token = req.query.token;
    let secretOrPrivateKey = global.tokenKey; // 这是加密的key（密钥）
    if(!token && !req.query.userInfo._id){
        res.jsonp({
            status:0,mess:'请重新登录'
        })
    }
    jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
        if (err) {  //  兼容旧版
            let userId2 = req.query.userInfo._id;
            Record.find({ $or:[{buyer:mongoose.Types.ObjectId(userId2)},{ buyer :userId2 },
                    {user:userId},{user:mongoose.Types.ObjectId(userId)}],isPay:true })
                .populate('magazine').sort({_id:-1})
                .exec(function (err,data) {
                    if(err)next(err);
                    // console.log('userBuy',userId2);
                    res.jsonp({
                        status:1,mess:'ok',data:data,userId:userId2
                    })
                })
        } else {
            let userId = decode._id;
            Record.find({ $or:[{buyer:mongoose.Types.ObjectId(userId)},{ buyer :userId },
                    {user:userId},{user:mongoose.Types.ObjectId(userId)}],isPay:true })
                .populate('magazine').sort({_id:-1})
                .exec(function (err,data) {
                    if(err)next(err);
                    // console.log('userRecord',data);
                    res.jsonp({
                        status:1,mess:'ok',data:data,userId:userId,token:token
                    })
                })
        }
    });
});

//购买杂志 前端确认支付后，生成该书阅读码返回前端
router.get('/purchase',function (req, res,next) {
    try {
        var query = req.query
            ,magazine = query.magazine //杂志的id那些
        ;
        //修改订单状态
        Record.findOneAndUpdate(
            {tradeId:query.out_trade_no},
            {
                isPay:true
            },
            function (err, data) {
                if(err)next(err);
                //更新用户充值总金额
                User.findOneAndUpdate({_id:query.userInfo._id},{
                    $inc:{allRecharge:query.amount }
                },function (err,doc) { });

                //新增杂志购买数量
                // Magazine.findOneAndUpdate({_id:magazine},{$inc:{sold:query.tradeCount}},function (err, doc) {}); // 增加销量
                //返回订阅码
                res.jsonp({status:1,mess:'ok',readCode:data.readCode})
            }
        )

    }catch (e){
        console.log(e);
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
        _query.isPay = true;
        _query.magazine = magazine;
        if(readCode){ //有阅读码，优先查询阅读码，不然查询用户购买记录
            _query.readCode = readCode;
        }else{
            // _query.buyer = user;
            _query.$or = [
                {buyer:mongoose.Types.ObjectId(user)},
                {buyer:user},
                {user:user}
            ]
        }
        // console.log(_query,'_query');
        Record.find(_query).sort({readCodeUsed:-1}).populate('magazine').exec(function (err, records) {
            if(err)next(err);
            if(records.length){
                console.log('找到阅读数据',records.length,'条');
                // 找到阅读吗了,表示可以用户购买了这本书或者拥有阅读吗
                for(var i=0;i<records.length;i++){

                    var data=records[i];
                    if(data.user.indexOf(user) != -1 || (data.tradeTime < '1588307736000')){ //在4月29日晚12点之前的订单，因为存在bug（阅读码被别人用了），所以只要在这之前购买的订单都可以直接使用
                        //  用户读过这本书（用户id在阅读吗使用过的数组中）
                        res.jsonp({
                            status:1,mess:'ok',magazine:data.magazine
                        });
                        return;
                    }else {
                        if(data.tradeCount > data.readCodeUsed){
                            //记录用户阅读历史，然后把杂志信息返回前端
                            Record.useRecord(magazine,data.readCode,user,function (err, data) {
                                if(err)next(err);
                                Magazine.findOne({_id:magazine},function (err, data) {
                                    if(err)next(err);
                                    res.jsonp({
                                        status:1,mess:'ok',magazine:data
                                    });
                                })
                            });
                            return;
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
        console.log('阅读杂志出错',e);
        res.jsonp({
            status:0,mess:'请稍后重试'
        });
    }
});



module.exports = router;
