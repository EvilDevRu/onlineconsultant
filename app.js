/**
 * Онлайн консультант.
 *
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @licence MIT
 */

'use strict';

require('./node_modules/nyama/Nyama.js');

var config = require('./config/console.js'),
    app;

/**
 * Run appication.
 */
_.Q.spawn(function*() {
    app = yield Nyama.createApplication(config);
    app.server.onConnection = onConnection;
    yield app.server.start();
});

/**
 * Событие при содключении пользователя.
 * @param socket
 */
function onConnection(socket) {
    _.Q.spawn(function*() {
        var uid = socket.handshake.session.uid,
            jabber = yield app.jabber.connect(uid),
            manager;

        /**
         * Когда клиент установил соединение с сервером.
         */
        jabber.on('online', function() {
            socket.emit('connection');
        });

        /**
         * Из джаббера клиенту.
         */
        jabber.on('chat', function(from, message) {
            //  TODO: Использовать проверку логинов, от кого пришло сообщение, если в дальнейшем будет реализован перевод на другого менеджера.
            socket.emit('message', message);
        });

        /**
         * Отправит более свободного менеджера.
         */
        socket.on('get_manager', function(data) {
            _.Q.spawn(function*() {
                if (!_.isNull(data.group)) {
                    var group = yield app.db.getModel('Groups').find({
                            where: {
                                alias: data.groupAlias + ''
                            }
                        }),
                        users = [];

                    if (!group) {
                        //  TODO: По всем группам работаем.
                        console.error('Группа не найдена', data.groupAlias);
                        return;
                    }

                    users = yield group.getUsers();

                    //  TODO: Вычислим менеджера по его загрузке, а пока берем первого попавшегося.
                    manager = _.first(users);
                    if (!manager) {
                        console.error('Менеджер не найден');
                        socket.emit('get_manager_status', 'offline');
                        return;
                    }

                    socket.emit('get_manager', {
                        name: manager.name,
                        img: 'http://' + app.server.getHost() + '/users/' + manager.id + '.jpg',
                        pos: manager.position
                    });
                }
                else {
                    //  TODO: Если группу не передали.
                }
            });
        });

        /**
         * Отправит статус менеджера.
         */
        socket.on('get_manager_status', function() {
            if (!manager) {
                return;
            }

            jabber.getStatus(manager.login).then(function(status) {
                socket.emit('get_manager_status', status);
            });
        });

        /**
         * Входявщее сообщение.
         */
        socket.on('message', function(message) {
            jabber.send(manager.login + '@' + app.jabber.getHost(), message);
        });
    });
}

/**
 * Дисконнект пользователя.
 */
function onDisconnect() {
    var time = (new Date()).toLocaleTimeString();
    app.server.getIO().sockets.json.send({ 'event': 'userSplit', 'name': this.id, 'time': time });
}