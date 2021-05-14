/**
 * 微信相关接口
 * **/

const https= require('https');

var get_wx_accesstoken = function(cb){
    https.get("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+global.webappid
        +"&secret="+global.websecret+"",
        function(res2) {
            var x = '';
            res2.on('data',function(d2){
                x = JSON.parse(d2.toString());
                console.log("access_token:"+JSON.stringify(x));
                global.access_token = x.access_token;
                global.access_token_deadline = parseInt(new Date().valueOf())+7100000;
                setTimeout(get_wx_accesstoken,7100*1000);//定时被动调用自身刷新access_token
                typeof cb =='function' && cb();

                https.get("https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token="+
                    global.access_token+"&type=jsapi",
                    function(res2) {
                        var x2 = '';
                        res2.on('data',function(d2){
                            x2 = JSON.parse(d2.toString());
                            console.log("jsapi_ticket:"+JSON.stringify(x2));
                            global.jsapi_ticket = x2.ticket;
                        })
                    }).on('error', function(e2) {
                    console.log("Got jsapi_ticket fail " + e2.message)
                });
            })
        }).on('error', function(e) {
        console.log("Got access_token fail " + e.message)
    });
};
exports.get_wx_accesstoken = get_wx_accesstoken;
