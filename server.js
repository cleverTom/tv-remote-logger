const express = require('express');
const app = express();
const swig = require('swig');
const bodyParser = require('body-parser');
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 8083;
const path = require('path');
const consoleRouter = require(path.join(__dirname, 'router', 'console.js'))(PORT, io);
const execRouter = require(path.join(__dirname, 'router', 'exec.js'))(PORT, io);

//设置静态文件;
app.use('/public', express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified:false
}));

//设置post解析;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//开发阶段清除缓存;
swig.setDefaults({cache: false});
app.set('view cache', false);
app.disable('etag');

//设置渲染引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', swig.renderFile);

//设置跨域
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    next();
});

app.get('/', function (req, res) {
    res.render('index');
});

app.use('/console', consoleRouter);
app.use('/execute', execRouter);

server.listen(PORT, function (err) {
    if (err) return console.error(err);
    console.log('启动监听服务: ' + PORT);
});