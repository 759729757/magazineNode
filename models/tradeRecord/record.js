/**
 * Created by CY on 2019-08-22.
 *  主要储存 阅读码
 */
var mongoose = require('mongoose');

var recordSchema = new mongoose.Schema({
    buyer:{type:mongoose.Schema.Types.ObjectId,ref:'user'},//关联到用户表,购买的人
    magazine:{type:mongoose.Schema.Types.ObjectId,ref:'magazine'},//关联到杂志表
    user:[String],//关联到用户表，使用的人 存入id

    magazineInfo:{
        //杂志信息,方便直接拿了用
        name:String,headImg:String
    },

    tradePride:Number,//交易金额
    tradeCount:{type:Number,default:1},//交易数量（买的杂志的数量，默认1
    tradeTime:{type:String},//产生交易的时间 存入时间戳，要用的时候再进行转换
    tradeId:String// 订单编号

    ,readCode:String,//阅读码，8位数
    readCodeUsed:{type:Number,default: 0},//阅读吗被使用的数量，默认0 ，不得超过交易数量 tradeCount


});
recordSchema.methods ={
    //使用阅读吗阅读了
    useRecord: function (magazine, readCode,user,cb) {
        return this
            .findOneAndUpdate(
                {magazine:magazine,readCode:readCode},{$inc:{readCodeUsed:1},$push:{ user: user }}
            ).exec(cb)
    }
};

mongoose.model('record',recordSchema);
