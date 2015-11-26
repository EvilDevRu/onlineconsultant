/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var XMPP = require('simple-xmpp').SimpleXMPP,
    statusClient = new XMPP();

module.exports = function() {
    var config;

    /**
     * @param {object} conf
     */
    this.init = function(conf) {
        var defer = _.Q.defer();

        if (conf && conf.components && conf.components.jabber) {
            config = conf.components.jabber;
        }

        if (!config.status) {
            defer.resolve();
        }
        else {
            //  Подключаем аккаунт, который будет отвечать за проверку статусов менеджеров.
            statusClient.connect(config.status);
            statusClient.on('online', function () {
                console.info('Jabber status account is online');

                //  Получим список всех пользователей (менеджеров) по подпишемся на них.
                var users = Nyama.app().db.getModel('Users').findAll({
                    where: {
                        is_active: 1
                    }
                });

                _.Q.spawnMap(users, function (user) {
                    console.log('Jabber status account subscribe to', user.login);
                    statusClient.subscribe(user.login + '@' + Nyama.app().jabber.getHost());
                });

                defer.resolve();
            });
        }

        return defer.promise;
    };

    /**
     * Подключит аккаунт к серверу и вернет экземпляр клиента.
     * @param {String} login
     * @param {String} password
     */
    this.connect = function(login, password) {
        //  FIXME: Возможна утечка памяти.
        var defer = _.Q.defer(),
            client = new XMPP(),
            prosody = Nyama.app().db.getModel('Prosody');

        prosody.removeAttribute('id');

        console.log('jabber connect', login);

        _.Q.spawn(function*() {
            var model = yield prosody.find({ where: { user: login }});
            if (!model) {
                yield prosody.createUser(login);
            }

            client.connect({
                jid: login + '@' + config.host,
                password: password || config.defaultPassword
            });
            client.getStatus = getStatus;

            defer.resolve(client);
        });

        return defer.promise;
    };

    /**
     * Вернет адрес хоста.
     * @return {String}
     */
    this.getHost = function() {
        return config.host;
    };

    /**
     * Вернет пароль для аккаунтов по умолчанию.
     * @return {String}
     */
    this.getDefaultPassword = function() {
        return config.defaultPassword;
    };
};


/**
 * Вернет статус пользователя (менеджера).
 * @param {String} login
 * @return {*}
 */
function getStatus(login) {
    var defer = _.Q.defer();
    //  FIXME: warning: possible EventEmitter memory leak detected. 11 probe_evildev@xmpp.local listeners added. Use emitter.setMaxListeners() to increase limit.
    statusClient.probe(login + '@' + Nyama.app().jabber.getHost(), function(status) {
        defer.resolve(status);
    });
    return defer.promise;
}