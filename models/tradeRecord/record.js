/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var recordSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'user'},//关联到用户表
    magazine:{type:mongoose.Schema.Types.ObjectId,ref:'magazine'},//关联到杂志表

    tradePride:Number,//交易金额
    tradeNum:{type:Number,default:1},//交易数量（买的杂志的数量，默认1
    tradeTime:{type:String}//产生交易的时间

    ,readCode:String,//阅读码，8位数
    readCodeUsed:{type:Boolean,default: false},//阅读吗是否已经被使用，默认不是


});
recordSchema.methods ={
    //使用阅读吗阅读了
    used: function (magazine, readCode,cb) {
        return this
            .findOneAndUpdate(
                {magazine:magazine,readCode:readCode},{readCodeUsed:true}
            ).exec(cb)
    }
};

mongoose.model('record',recordSchema);
