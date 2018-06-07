##Tv-Remote-Logger 使用指南
### 简介
为了方便在TV端和移动端能够方便的查看log信息,本模块能够在浏览器端和移动端提供一套统一的API来方便本地调试和真机调试;
### 安装
首先安装`tv-remote-logger`模块,推荐全局安装此模块,可以开启本地log服务;
```bash
npm install -g tv-remote-logger
```
会自动创建两个CLI全局命名,分别是`loggers`和`logs`,`logs`是`loggers`的别名;

### 使用
#### 本地使用
1. 确保全局安装了`pm2模块`,首先在命令行中使用`logs start`开启本地服务器,能够接受log信息,并且在浏览器页面输出log信息;
```bash
logs start
```
会默认使用`pm2`默认启动一个日志转发服务模块,使用`pm2 list`可以查看名为`logger`的服务;
2. 使用`logs open`即可打开配置首页;
```bash
logs open
```
![logger-index](https://img.alicdn.com/tfs/TB19qd4whGYBuNjy0FnXXX5lpXa-1168-541.png)

3. 客户端引入`tv-remote-logger`的客户端模块,开发是带有日志的模式,线上建议引用生产环境(无日志输出),根据`process.env.NODE_ENV`进行判断引入,首先输入页面名称,创建页面,然后即可获取本机ip;
![copy address](https://img.alicdn.com/tfs/TB1aQMEv3mTBuNjy1XbXXaMrVXa-1870-381.png)
```html
<script src="//g.alicdn.com/tvtaobao-assets/fills/1.0.19/client.min.js"></script>
<script type="text/javascript">
// 启动客户端服务
logger.auto({
    url: "http://ip-address:8083", //点击复制地址,拷贝本机地址
    page: "test-page", //和主页输入的page名称保持一致
    remote: true, //true代表日志转发,false表示调用环境console.log直接输出日志
    exports: ['log as debug', 'error', 'dirxml'], //导出全局变量名称,默认在logger命名空间下
    exec: false, //是否开启远程调试js
    result: function (res) { //日志转发成功的本机日志,使用adb抓取获得;
      console.log(JSON.stringify(res));
    }
  });
</script>
```
4. 查看log信息: 打开console栏,日志默认输出在主页的日志当中;
![log信息输出页](https://img.alicdn.com/tfs/TB1jihgwbGYBuNjy0FoXXciBFXa-1870-958.png)

### 客户端基本用法
1. `logger.log()`
  客户端的log信息基本支持现有`console`模块的所有用法,比如`logger.warn,logger.log,logger.count`等一系列W3C定义的`console`方法,完全如同在浏览器中使用`console.log()`一样,唯一的不同是将`console.log`改为`logger.log`, `trace`捕获栈信息暂时不支持,因为日志转发后堆栈信息丢失;
8. `logger.auto(obj)`
`auto`里面会自动调用一些功能来一键启动服务:
- 自动调用`clearScreen`方法,每次页面初始化都清除上次的log;
- 自动调用`connect`方法进行连接;

**选项:auto方法传入的为object类型,参数如下:**

- `url`:String,logger-server的远程服务地址;
- `name`:String,日志输出的page名称,在主页输入的name;
- `result`:Function,`getResult`方法的回调函数,(选填),是否查看`AJAX`响应信息;
- `exec`: 在日志输出模块,可以在输入栏放入js代码,点击执行代码,可在远程设备执行,调用`eval`,慎用;
- `exports`: 默认所有方法都在`logger`的namespace下,为了方便使用,可以使用全局变量导出的格式,`['log']`,那么全局直接调用`log()`方法即可,如需使用`alias`,格式为:`['log as debug']`的形式导出;
- `remote`: 可以选择日志是否转发或者在本地使用`console`模块直接输出日志,默认`true`;
