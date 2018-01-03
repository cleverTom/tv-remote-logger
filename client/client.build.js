(function () {
    window.logger = {
        exports: [],
        methodAliasList: [],
        auto: function (config) {
            this.exports = Array.isArray(config.exports) ? config.exports : this.exports;
            this.setMethodAlias(this.exports);
        },
        setMethodAlias: function (arr) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var list = arr[i].split(/\sas\s/);
                var exportName = list[0];
                var alias = list.length === 2 ? list[1] : exportName;
                window[alias] = this.noop;
                this.methodAliasList.push(alias);
            }
        },
        noop: function () {

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
        ]
    };

    logger.methodNames.forEach(function (method) {
        logger[method] = logger.noop;
    });
})();