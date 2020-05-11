/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var videoSchema = new mongoose.Schema({
    name:String,
    url:String,

});


mongoose.model('video',videoSchema);
