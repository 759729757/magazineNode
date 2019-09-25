/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var magazineSchema = new mongoose.Schema({
    name:String,
    subTitle:String,//副标题
    describe:String,//述描
    headImg:String,//封面图片(并到 subHeadImg 中，这个不用）

    type:[String],//类型,可多个
    subHeadImg:[String],//详情页的封面图，可以多张
    magazine:[String],//内容图片链接，多张
    sold:Number,//销售数量
    price:{type:Number,default:6},//定价
    rank:{type:Number,default: 0},//排序权重 ，越高越靠前，默认是0 （可用作首页显示）

    magazineNum:'',//用于记录图片文件存放路径，方便后期整理
    putAway:{type:Boolean,default:true}//是否上架


});

// magazineSchema.statics={
//
// };

mongoose.model('magazine',magazineSchema);
