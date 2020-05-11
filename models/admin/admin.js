/**
 * Created by CY on 2019-08-22.
 */
var mongoose = require('mongoose');

var adminSchema = new mongoose.Schema({
    name:{type:String,default:'管理员'},
    userName:{type:String},
    password: {type:String},

});

adminSchema.statics={
    login: function (name, psw,cb) {
        return this
            .findOneAndUpdate(
                {name:name,password:psw},{loginDate:new Date().toLocaleDateString()}
            ).exec(cb)
    }
};

mongoose.model('admin',adminSchema);


