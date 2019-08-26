#后端开发和结构文档

登录完成后，前端把得到的token设置在header中一起提交至后端，key为Authorization
 
涉及到用户信息的东西都需要通过token认证（需要把对应的路由放在 router.get('/*'）之后）

