/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var Express = require('express'),
    Session = require('express-session'),
    SessionStore = require('session-file-store')(Session),
    XMPP = require('simple-xmpp').SimpleXMPP;

module.exports = function() {
    var config = {},
        io,
        app,
        http,
        session;

    /**
     * @param {object} conf
     */
    this.init = function(conf) {
        var defer = _.Q.defer();

        if (conf && conf.components && conf.components.server) {
            config = conf.components.server;
        }

        defer.resolve();    //  TODO: Сделать чтобы сразу отдавал результат.

        return defer.promise;
    };

    /**
     * Запуск сервера.
     */
    this.start = function() {
        var port = config.port || 8080;

        app = Express();
        http = require('http').Server(app);
        io = require('socket.io')(http);
        session = Session({
            store: new SessionStore({ path: __dirname + '/../tmp/sessions' }), //   FIXME: Session expire
            secret: 'pass',
            resave: true,
            saveUninitialized: true,
            cookie: {
                path: '/',
                httpOnly: true,
                secure: false,
                expires: false,
                maxAge: 30 * 24 * 60 * 60 * 1000    //  30 дней.
            }
        });

        app.use(Express.static(__dirname + '/../public'));
        app.use(session);

        /**
         * Регистрация пользователя.
         * @param {Object} req
         * @param {Object} res
         */
        app.get('/register', function(req, res) {
            if (!req.session.uid) {
                req.session.uid = Date.now();   //  FIXME: UNIQ value
            }
            res.jsonp({ uid: req.session.uid });
        });

        io.use(require('socket.io-express-session')(session));
        io.on('connection', this.onConnection);

        //  TODO: Админка

        http.listen(port, function() {
            console.log('Server is started on ' + port + ' port');
        });
    };

    /**
     * Событие соединения клиента с сервером.
     */
    this.onConnection = function() {};

    /**
     * Вернет IO
     * @returns {*}
     */
    this.getIO = function() {
        return io;
    };

    /**
     * Вернет название хоста сервера.
     * @return {String}
     */
    this.getHost = function() {
        return config.host;
    };
};