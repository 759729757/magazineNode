
const fs= require('fs');
const jwt = require('jsonwebtoken');  //用来生成token
var request = require('request');

var token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuaWQiOiJvSFZMZDRyVkpRaldMMzhHNTRsc0VNMVJjaVpFIiwiX2lkIjoiNWVhOTZkY2UwOWI3ZjAwOTFjZDRiZjdjIiwiaWF0IjoxNTg4MTg0Mjg4LCJleHAiOjE1ODgxOTE0ODh9.DZeloiALIGmUC2whQ0em9SsStRwSGTngTuP5GvnDqgM"

var str ='Pwe5x8"],"out_trade_no1587620728142OMFA5QC3CRo600"],"result_codePwe5x8"],"out_trade_no1587620728142OMFA5QC3CRo600"],"result_code'
var re = /ut_trade_no(.*)"/;
str_new = str.match(re);
// console.log(str_new);

// var pattern = /out_trade_no(.*)\"/;
// var testStr = 'out_trade_no1587620728142OMFA5QC3CRo600"]';
// var result = testStr.match(pattern);
// console.log(result[1])
function check(tid){

    request({
        url: 'http://wechat.planetofficial.cn/admin/getRecord?tradeId='+tid,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
            'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJpYXQiOjE1ODgzMDg1OTEsImV4cCI6MTU4ODM5NDk5MX0.nHndX0gBdv3dXgf6FFt2g2AdEipulyFxwxJg7QT6Hjw"
        },
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            // console.log('check：',body);
            try {
                console.log('body:',body.data[0].isPay);
                if(!body.data[0].isPay){
                    console.log(body.data[0].tradeId);
                    fs.writeFile('trd.txt',body.data[0].tradeId+",", { 'flag': 'a' }, function(err) {
                        console.log('已经无效订单：.',body.data[0].tradeId);
                    });
                    setPay(tid);
                }
            } catch (e) {
                console.log(e);
            }
        }
    });
}

function setPay(tid){
    request({
        url: 'http://wechat.planetofficial.cn/admin/readCodePay?tradeId='+tid,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
            'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJpYXQiOjE1ODgyMTA0NzIsImV4cCI6MTU4ODI5Njg3Mn0.uIyqClm4OIvFFMcbIPopeCzdoSh7pLZpuySzjG3evyY"
        },
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            // console.log('发送的数据',formData);
            try {
                console.log('已经完成修改:',body.mess);
            } catch (e) {
                console.log(e);
            }
        }
    });
}

fs.readFile('purchaseCallback.txt','utf8', (err, data) => {
    if (err) throw err;
    let Alldata = data.split(',');
    var da = [];
    for (var i=600;i<Alldata.length;i++){
        var tid = Alldata[i].substring(0,Alldata[i].indexOf('"]'));
        // da.push(tid)
        check(tid)
    }
        // check(Alldata[1].replace(/\s/g,''));
});

// jwt.verify(token, 'magazine', (err, decode)=> {
//     if (err) {  //  时间失效的时候 || 伪造的token
//         console.log(err)
//     } else {
//         console.log(decode)
//
//     }
// })
