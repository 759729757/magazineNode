/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var mgzTypeSchema = new mongoose.Schema({
    name:String,
    rank:{type:Number,default: 0},//排序权重 ，越高越靠前，默认是0 （可用作首页显示）


});

// magazineSchema.statics={
//
// };

mongoose.model('mgzType',mgzTypeSchema);
