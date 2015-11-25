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


    /*yield app.db.getModel('Users').createUser('evildev', 'Имя Барнаул', 'Название должности', 1, true);
     yield app.db.getModel('Users').createUser('evildev1', 'Имя 2', 'Должность', 2, true);
    yield app.db.getModel('Prosody').createUser('status');
    yield app.db.getModel('Groups').create({
        name: 'Барнаул',
        alias: '1'
    });
    yield app.db.getModel('Groups').create({
        name: 'Белгород',
        alias: '8'
    });*/

    app.server.onConnection = onConnection;
    app.server.start();
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


        //console.log("Session: ", socket.handshake);
        //socket.handshake.session = { ss: 1 };

        // Посылаем клиенту сообщение о том, что он успешно подключился и его имя
        /*socket.json.send({ 'event': 'connected', 'name': id, 'time': time });

         // Посылаем всем остальным пользователям, что подключился новый клиент и его имя
         socket.broadcast.json.send({ 'event': 'userJoined', 'name': id, 'time': time });

         // Навешиваем обработчик на входящее сообщение
         socket.on('message', onMessage.bind(socket).bind(id));

         // При отключении клиента - уведомляем остальных
         socket.on('disconnect', onDisconnect.bind(id));*/


        /**
         * Отправит более свободного менеджера.
         */
        socket.on('get_manager', function(data) {
            _.Q.spawn(function*() {
                if (!_.isNull(data.group)) {
                    var group = yield app.db.getModel('Groups').find({
                            where: {
                                alias: data.groupAlias
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
 * Событие отправки сообщения.
 * @param {string} message
 */
function onMessage(message) {
    var time = (new Date()).toLocaleTimeString();

    // Уведомляем клиента, что его сообщение успешно дошло до сервера
    //this.socket.json.send({'event': 'messageSent', 'name': this.id, 'text': message, 'time': time});

    // Отсылаем сообщение остальным участникам чата
    //this.socket.broadcast.json.send({'event': 'messageReceived', 'name': this.id, 'text': message, 'time': time})
}

/**
 * Дисконнект пользователя.
 */
function onDisconnect() {
    var time = (new Date()).toLocaleTimeString();
    app.server.getIO().sockets.json.send({ 'event': 'userSplit', 'name': this.id, 'time': time });
}