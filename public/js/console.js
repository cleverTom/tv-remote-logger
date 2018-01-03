function clearScreen() {
    document.querySelector("tbody").innerHTML = '';
    console.clear();//清空控制台
}

function retrocycle($) {
    "use strict";
    var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;
    (function rez(value) {
        if (value && typeof value === "object") {
            if (Array.isArray(value)) {
                value.forEach(function (element, i) {
                    if (typeof element === "object" && element !== null) {
                        var path = element.$ref;
                        if (typeof path === "string" && px.test(path)) {
                            value[i] = eval(path);
                        } else {
                            rez(element);
                        }
                    }
                });
            } else {
                Object.keys(value).forEach(function (name) {
                    var item = value[name];
                    if (typeof item === "object" && item !== null) {
                        var path = item.$ref;
                        if (typeof path === "string" && px.test(path)) {
                            value[name] = eval(path);
                        } else {
                            rez(item);
                        }
                    }
                });
            }
        }
    }($));
    return $;
}

var page = document.querySelector('.page').querySelector('span').innerHTML;
var btn = document.getElementById('clip');
var clipboard = new Clipboard(btn);//实例化

//复制成功执行的回调，可选
clipboard.on('success', function (e) {
    console.log('复制地址成功');
});
//复制失败执行的回调，可选
clipboard.on('error', function (e) {
    console.log('复制地址失败');
});

var execBtn = document.querySelector('#exec-content');
var clearBtn = document.querySelector('#clear-content');
var codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('command'), {
    mode: 'text/javascript',
    lineNumbers: true,
    smartIndent: true,
    indentUnit: 4,
    indentWithTabs: true,
    autofocus: true,
    styleActiveLine: true,
    extraKeys: {'Tab': 'autocomplete'},
    autoCloseBrackets: true,
    theme: 'panda-syntax',
    lineWrapping: true
});
clearBtn.addEventListener('click', function () {
    codeMirrorEditor.setValue('');
});

execBtn.addEventListener('click', function () {
    var command = encodeURIComponent(codeMirrorEditor.getValue());
    execSockets.emit('exec', {
        page: page,
        command: `${command}`
    });
});
var execSockets = io('/execute');

var socket = io('/console');
var tasks = [];
socket.emit("page", page);
socket.on('datas', function (data) {
    data.time = Number(data.time);
    data.count = Number(data.count);
    data.length = Number(data.length);
    try {
        if (data.props.includes('$ref')) {
            data.props = JSON.parse(data.props);
            data.props.forEach(function (item, index, arr) {
                if(typeof item === 'object' && item !== null) {
                    arr[index] = retrocycle(item);
                }
            });
        }
        else {
            data.props = JSON.parse(data.props);
        }
    }
    catch (err) {
        console.error("非标准格式log信息,解析失败,原样输出", err);
    }
    finally {
        tasks.push(data);
    }
});

socket.on("clearscreen", function () {
    clearScreen();
});

//原顺序输出log信息;
setInterval(function () {
    if (tasks.length > 0) {
        var curTasks = tasks.concat();
        tasks = [];
        curTasks = curTasks.sort(function (a, b) {
            return a.count - b.count;
        });
        curTasks.forEach(function (data) {
            if (data.dom !== 'noop') {
                data.dom.split(',').forEach(function (index) {
                    var index = parseInt(index);
                    var dom = document.createElement('div');
                    dom.innerHTML = data.props[index];
                    data.props[index] = dom.children[0];
                });
            }
            console[data.type].apply(console, data.props);
            var tr = document.createElement("tr");
            tr.innerHTML = '<td>' + data.count + '</td><td>POST</td><td>' + data.type + '</td><td>' + (new Date(data.time).toLocaleString()) + '</td><td>' + data.time + '</td>';
            document.querySelector("tbody").appendChild(tr);
        });
    }
}, 0);
document.querySelector("#clearPage").addEventListener("click", clearScreen);