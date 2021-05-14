/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    nickName:{type:String,default:'暂无'},//微信昵称
    avatarUrl:String,//微信头像
    province:String,//省份
    city:String,
    telephone:String,
    gender:String,//性别
    userInfo:Object,    //用户信息
    //重要信息
    openId:String,
    unionId:String,

    wxopenid:String,//服务号openid
//    其他信息
    systemInfo:{},//用户设备信息
    vipLevel:{type:Number,default: 0},//会员等级，0是没有，1是普通会员，2高级会员~
    allRecharge:{type:Number,default:0},//总共充值金额
    // balance:{type:Number,default:0},//总共充值金额  暂时不需要

});

userSchema.statics={

};

mongoose.model('user',userSchema);
