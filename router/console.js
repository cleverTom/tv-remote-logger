module.exports = exports = function (port, io) {
    const path = require('path');
    const express = require('express');
    const router = express.Router();
    const pageMap = new Map();
    const schedule = require('node-schedule');

    class Logger {
        constructor(page) {
            this.page = page;
            this.socket = null;
        }

        setSocket(socket) {
            this.socket = socket;
        }

        hasSocket() {
            return !!this.socket;
        }

        getSocket() {
            return this.socket;
        }

        static getClientIp() {
            const os = require("os");
            const ifaces = os.networkInterfaces();
            let ip = '';
            Object.keys(ifaces).forEach(function (dev) {
                ifaces[dev].forEach(function (details) {
                    if (details.family === 'IPv4' && details.address !== "127.0.0.1") {
                        ip = details.address + ':' + port;
                    }
                });
            });
            return ip;
        }
    }

    router
        .route('/:page')
        .get(function (req, res) {
            const page = req.params.page;
            pageMap.delete(page);
            const instance = new Logger(page);
            pageMap.set(page, instance);
            res.render('console', {
                page,
                address: Logger.getClientIp()
            });
        })
        .post(function (req, res) {
            const page = req.params.page;
            const instance = pageMap.get(page);
            if (!pageMap.has(page)) return res.json({status: false, message: 'logger page is not exist'});
            if (!instance.hasSocket()) return res.json({status: false, message: 'logger socket is not exist'});
            const socket = instance.getSocket();
            instance.lastModified = Date.now();
            const messages = req.body;
            if (messages.clearScreen === 'true') {
                socket.emit('clearscreen', true);
                return res.json({
                    status: true,
                    message: 'clear ok'
                });
            }
            socket.emit('datas', messages);
            res.json({status: true, message: 'print ok'});
        });

    io.of('/console').on('connection', function (socket) {
        socket.on('page', function (page) {
            const instance = pageMap.get(page);
            if (instance && !instance.hasSocket()) {
                instance.setSocket(socket);
            }
        });
    });

    const loop = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0];
    const rule = new schedule.RecurrenceRule();
    rule.second = loop;
    schedule.scheduleJob(rule, function () {
        for (let [page, ins] of pageMap) {
            if (ins.lastModified && Date.now() - ins.lastModified > 20 * 60 * 1000) {
                console.log('session过期,删除page: ', page);
                pageMap.delete(page);
            }
        }
    });
    return router;
};