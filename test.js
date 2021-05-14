
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  //用来生成token
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuaWQiOiJvMjV1WXYxaGpER0V1NWR0ek44eERPYW43V0JJIiwiX2lkIjoiNWY2MDU2MDk0ZTYwZGQxYWY0ODU0OTdlIiwiYWNjZXNzX3Rva2VuIjoiNDVfN0k0d3dZTVBqOTF6bnVnMXk0QkwwNk9lT2VsclEzNnJHQUJQOU45UlpHOFd3VVNlQTJlWFNicXplR1BocDA5WGpyU2RKcHVpMU43eHZERHh0NEp1OFEiLCJpYXQiOjE2MjA5MTYxNjUsImV4cCI6MTYyMDkzMDU2NX0.etV87u9bTslfRdz3H6SgaRToWOGNQfTKRawAJqfx49k';
let secretOrPrivateKey = 'magazine'; // 这是加密的key（密钥）
    jwt.verify(token, secretOrPrivateKey, (err, decode)=> {
        if (err) {  //  时间失效的时候 || 伪造的token
            console.log('err', err);
        } else {
            console.log('decode', decode.openid);
        }
    })