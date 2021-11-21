/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var addressSchema = new mongoose.Schema({
    user: String,// 关联到用户表的tokenId
    userName: String,
    phoneNumber: String,
    // 省份
    prov: String,
    // 城市
    city: String,
    // 地区
    district: String,
    // 详细地址
    address: String,

});


mongoose.model('address', addressSchema);
