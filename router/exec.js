module.exports = exports = function (port, io) {
    const express = require('express');
    const router = express.Router();
    const pageMap = new Map();
    router
        .route('/:page')
        .get(function (req, res) {
            const page = req.params.page;
            if (pageMap.has(page)) {
                const command = pageMap.get(page);
                pageMap.delete(page);
                res.json({
                    status: true,
                    message: 'excute command',
                    command: command
                });
            }
            else {
                res.json({
                    status: false,
                    message: 'no excute command',
                    command: null
                });
            }
        });

    io.of('/execute').on('connection', function (socket) {
        socket.on('exec', function (msg) {
            const {page, command} = msg;
            pageMap.set(page, command);
        });
    });

    return router;
};