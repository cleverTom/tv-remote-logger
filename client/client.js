;(function () {
    function ajax(option) {
        var xhr = new XMLHttpRequest();
        var async = option.async !== false;
        var cache = option.cache !== false;
        var url = option.url;
        var type = option.type ? option.type.toUpperCase() : 'GET';
        var query = option.query ? option.query : {};
        var header = option.header ? option.header : {};
        var data = option.data || {};
        var dataType = option.dataType ? option.dataType : 'text';
        var success = option.success && typeof option.success === 'function' ? option.success : null;
        var error = option.error && typeof option.error === 'function' ? option.error : null;
        var complete = option.complete && typeof option.complete === 'function' ? option.complete : null;
        var context = option.context ? option.context : option;
        var timeout = option.timeout && typeof option.timeout === 'number' ? option.timeout : null;
        var timer = null;
        var isJSONP = dataType === 'jsonp';
        var jsonp = option.jsonp || 'callback';
        var jsonpCallback = option.jsonpCallback || 'callback' + Math.ceil(Math.random() * 10000);

        //处理jsonp请求
        var setJSONP = function (reqName, callbackName) {
            var script = document.createElement('script');
            script.src = url;
            window[callbackName] = function (data) {
                success && success.call(context, data);
                document.body.removeChild(script);
                window[callbackName] = undefined;
            };
            document.body.appendChild(script);
        };

        //处理query和cache部分
        var query_str = '';
        if (isJSONP) {
            query[jsonp] = jsonpCallback;
        }
        if (Object.keys(query).length) {
            var index = 0;
            for (var key in query) {
                if (query.hasOwnProperty(key)) {
                    var value = query[key];
                    if (index === Object.keys(query).length - 1) {
                        query_str += key + '=' + value;
                    }
                    else {
                        query_str += key + '=' + value + '&';
                    }

                    index++;
                }
            }
        }
        url = (query_str ? url + '?' + query_str : url) + (!cache && type === 'GET' ? (query_str ? '&' : '?') + ('ajaxCache=' + Date.now()) : '');
        //解析jsonp;
        if (type === 'GET' && isJSONP) {
            return setJSONP(jsonp, jsonpCallback);
        }
        xhr.open(type, url, async);
        //处理响应
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                clearTimeout(timer);
                var response = '';
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    switch (dataType) {
                        case 'text':
                            response = xhr.responseText;
                            break;
                        case 'json':
                            response = JSON.parse(xhr.responseText);
                            break;
                        case 'xml':
                            response = xhr.responseXML;
                            break;
                        default:
                            response = xhr.responseText;
                            break;
                    }
                    success && success.call(context, response);
                }
                else {
                    error && error.call(context, xhr);
                }
                complete && complete.call(context, xhr);
            }
        };
        //处理post请求头
        if (type === 'POST' && (!header['Content-Type'] || !header['content-type'])) {
            header['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (Object.keys(header).length) {
            for (var key in header) {
                if (header.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, header[key]);
                }
            }
        }
        //处理post数据
        var data_str = '';
        if (Object.keys(data).length) {
            var index = 0;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    if (index === Object.keys(data).length - 1) {
                        data_str += key + '=' + data[key];
                    }
                    else {
                        data_str += key + '=' + data[key] + '&';
                    }
                    index++;
                }
            }
        }
        xhr.send(data_str ? data_str : null);
        if (timeout && !isJSONP) {
            timer = setTimeout(function () {
                xhr.abort();
                xhr.error = 'timeout';
            }, timeout);
        }
    }

    var Logger = {
        counter: 0,
        url: 'http://localhost:8083',
        page: 'log',
        result: function () {
        },
        exports: null,
        methodAliasList: [],
        err: null,
        remote: true,
        stringify: function (value) {//自定义stringify,防止循环引用
            var str_obj = [];
            try {
                str_obj = JSON.stringify(value);
            }
            catch (err) {
                var self = this;
                value.forEach(function (item, index, arr) {
                    if (typeof item === 'object' && item !== null) {
                        arr[index] = self.decycle(item);
                    }
                });
                str_obj = JSON.stringify(value);
            }
            finally {
                str_obj = typeof str_obj === 'object' ? JSON.stringify(['终态处理对象失败,自行检查错误']) : str_obj;
            }
            return str_obj;
        },
        methodNames: [
            "info",
            "warn",
            "error",
            "log",
            "table",
            "time",
            "timeEnd",
            "trace",
            "assert",
            "dir",
            "dirxml",
            "count",
            "group",
            "groupEnd"
        ],
        send: function (method, props) {
            props = Array.prototype.slice.call(props, 0);

            var dom = props.reduce(function (store, item, index, arr) {
                if (/element/i.test(Object.prototype.toString.call(item))) {
                    arr[index] = item.outerHTML;
                    store.push(index);
                }
                else if (/\w*(?=\])/.exec(Object.prototype.toString.call(item))[0].toLocaleLowerCase() === 'error') {
                    arr[index] = item.toString();
                }
                return store;
            }, []);

            ajax({
                url: this.url + "/console/" + this.page,
                type: 'POST',
                dataType: 'json',
                data: {
                    type: method,
                    props: encodeURIComponent(this.stringify(props)),
                    time: Date.now(),
                    count: this.counter,
                    dom: (dom.length ? dom.join(',') : "noop")
                },
                success: function (response) {
                    this.result && this.result(response);
                }.bind(this)
            });
            this.counter++;
        },
        decycle: function (object, replacer) {
            var objects = new Array();
            return (function derez(value, path) {
                var old_path;
                var nu;
                if (replacer !== undefined) {
                    value = replacer(value);
                }
                if (
                    typeof value === "object" && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date) &&
                    !(value instanceof Number) &&
                    !(value instanceof RegExp) &&
                    !(value instanceof String)
                ) {
                    var tmp = objects.filter(function (item) {
                        if (item.key === value) {
                            return item;
                        }
                    });
                    old_path = tmp.length ? tmp[0].path : undefined;
                    if (old_path !== undefined) {
                        return {$ref: old_path};
                    }
                    objects.push({
                        key: value,
                        path: path
                    });
                    if (Array.isArray(value)) {
                        nu = [];
                        value.forEach(function (element, i) {
                            nu[i] = derez(element, path + "[" + i + "]");
                        });
                    } else {
                        nu = {};
                        Object.keys(value).forEach(function (name) {
                            nu[name] = derez(
                                value[name],
                                path + "[" + JSON.stringify(name) + "]"
                            );
                        });
                    }
                    return nu;
                }
                return value;
            }(object, "$"));
        },
        clear: function () {
            var self = this;
            ajax({
                url: this.url + "/console/" + this.page,
                type: 'POST',
                dataType: 'json',
                data: {
                    clearScreen: true
                },
                success: function (response) {
                    this.result && this.result(response);
                }.bind(this)
            });
        },
        noop: function () {

        },
        auto: function (config) {
            var build = config.build;
            var self = this;
            this.url = config.url ? config.url : this.url;
            this.page = config.page ? config.page : this.page;
            this.result = config.result ? config.result : this.result;
            this.err = typeof config.err === 'function' ? config.err : this.err;
            this.exports = Array.isArray(config.exports) ? config.exports : this.exports;
            this.remote = config.remote === false ? false : this.remote;
            this.exec = config.exec === true;
            if (this.exports && this.exports.length) {
                this.setMethodAlias(this.exports);
            }

            if (build) { //生产环境
                return (this.send = this.noop);
            }

            if (!this.remote) {
                this.send = function (method, args) {
                    args = Array.prototype.slice.call(args, 0);
                    console[method].apply(console, args);
                };
                return;
            }

            if (this.err) {
                this.err(function () {
                    self.send.call(Logger, 'error', arguments);
                });
            }
            if (this.exec) {
                this.execCommand();
            }
            if (config.clear === undefined || config.clear === true) {
                this.clear();
            }
        },
        setMethodAlias: function (arr) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var list = arr[i].split(/\sas\s/);
                var exportName = list[0];
                var alias = list.length === 2 ? list[1] : exportName;
                window[alias] = logger[exportName].bind(this);
                this.methodAliasList.push(alias);
            }
        },
        execCommand: function () {
            setInterval(function () {
                ajax({
                    url: this.url + "/execute/" + this.page,
                    type: 'GET',
                    dataType: 'json',
                    success: function (response) {
                        if (response.status === true) {
                            var command = decodeURIComponent(response.command);
                            try {
                                eval(command);
                                this.result && this.result(response);
                            }
                            catch (err) {
                                this.result && this.result(err);
                                this.send('error', [err]);
                            }
                        }
                        else {
                            this.result && this.result(response);
                        }
                    }.bind(this)
                });
            }.bind(this), 1000);
        }
    };

    var export_obj = {
        auto: Logger.auto.bind(Logger)
    };

    Logger.methodNames.forEach(function (method) {
        export_obj[method] = function () {
            Logger.send.call(Logger, method, arguments);
        };
    });

    window.logger = export_obj;
})();