const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const yaml = require('js-yaml');
const readFileSync = require('fs').readFileSync;
const path = require('path');
exec('pm2 jlist', function (err, stdout, stderr) {
    if (err || stderr) {
        return console.error('err: \n', err, 'stderr: \n', stderr);
    }
    try {
        var jlist = JSON.parse(stdout);
        var root = execSync('echo $HOME', {encoding: 'UTF-8'}).slice(0, -1);
        var config = path.join(root, '.loggers.config.yml');
        var port = yaml.load(readFileSync(config), 'UTF-8').port || 8083;
        var instance = jlist.filter(function (ins) {
            if (ins.name === 'logger') {
                return ins;
            }
        });
        if (!instance.length) {
            return execSync('PORT=' + port + ' pm2 start --name logger server.js', {cwd: __dirname});
        }
        else {
            const loggerIns = instance[0];
            if (loggerIns.pm2_env.status === 'stopped') {
                return execSync('pm2 start logger', {cwd: __dirname});
            }
        }
    }
    catch (err) {
        console.error('检查Logger失败', err);
    }
});