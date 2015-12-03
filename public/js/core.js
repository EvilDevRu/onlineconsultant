/**
 * Онлайн консультант.
 *
 * @version 1.0
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var IS_DEBUG = localStorage.getItem('debug') === '*';

/**
 * @class OnlineConsult
 */
var OnlineConsult = function(hostName) {
    var socket,
        userId,
        groupName = null,
        incoming = new Audio('http://' + hostName + '/sounds/incoming.mp3');

    /**
     * Добавление HTML кода на страницу.
     */
    this.init = function() {
        var _this = this;

        $('body').append('<!-- ONLINE CONSULT -->' +
            '<div class="onlineconsult">' +
            '<div class="oc-window">' +
                '<div class="btn-block oc-bg oc-header">' +
                    '<div class="btn btn-block oc-bg-inside">' +
                        'Онлайн-консультант' +
                        '<div class="pull-right"><span class="btn-oc" id="ocClose">_</span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="oc-manager" id="ocManager">' +
                    '<img src="#" />' +
                    '<strong id="ocName"></strong>' +
                    '<small id="ocPos"></small>' +
                '</div>' +
                '<div class="oc-messages">' +
                    '<ul class="oc-messages-content">' +
                    '</ul>' +
                '</div>' +
                '<form class="oc-footer" id="ocMsgForm">' +
                    '<textarea class="form-control" placeholder="Текст сообщения" maxlength="512"></textarea>' +
                    '<small class="text-muted">(beta)</small>' +
                    '<button class="btn btn-xs pull-right" disabled="disabled" id="ocSendMessage">отправить</button>' +
                '</form>' +
            '</div>' +
            '<a href="#" class="btn-block oc-bg" id="ocOpen">' +
            '<div class="btn btn-block oc-bg-inside">' +
                '<i class="glyphicon glyphicon-comment"></i> Консультант <span id="ocStatus" class="btn-oc">офлайн</span>' +
            '</div>' +
            '</a>' +
            '</div>' +
            '<!-- /ONLINE CONSULT -->');

        jQuery('body')
        /**
         * Откроет диалог.
         */
            .on('click', '#ocOpen', function() {
                return _this.onOpen.call(this);
            })
        /**
         * Скроет диалог.
         */
            .on('click', '#ocClose', function() {
                return _this.onClose.call(this);
            })
        /**
         * Отправка сообщения.
         */
            .on('submit', '#ocMsgForm', function() {
                _this.sendMessage(null, jQuery(this).find('textarea').val(), false, window.ONLINE_CONSULT_GROUP_ALIAS || null);
                return false;
            })
            .on('keydown', '#ocMsgForm textarea', function(e) {
                if (e.ctrlKey && e.keyCode === 13) {
                    _this.sendMessage(null, jQuery(this).val(), false, window.ONLINE_CONSULT_GROUP_ALIAS || null);
                }
            });
    };

    /**
     * Соединится с сервером.
     * @param {Function} callback
     */
    this.connect = function(callback) {
        if (!io) {
            console.log('No IO defined');
            return;
        }

        if (socket && socket.connected) {
            return;
        }

        //  Получим ID пользователя в системе.
        this.getUserId(function (error, id) {
            if (error) {
                callback(error || 'Что то пошло не так.');
                return;
            }

            userId = id;
            socket = io.connect('ws://' + hostName, { jsonp: false });

            //  Заполним историю переписки.
            var hostory = this.getHistory();
            for (var timestamp in hostory) {
                if (hostory.hasOwnProperty(timestamp)) {
                    this.addMessage(hostory[timestamp].name, hostory[timestamp].message, hostory[timestamp].isManager);
                }
            }


            /**
             * Срабатывает при соединении пользователя с сервером.
             * @param {Object} socket
             */
            socket.on('connection', function() {
                console.log('Online consult has been connected');

                //  Запрос на получение статуса менеджера.
                socket.emit('get_manager', { groupAlias: window.ONLINE_CONSULT_GROUP_ALIAS || null });
            });

            /**
             * Срабатывает при возникновении ошибки соединения.
             */
            socket.on('connect_error', function() {
                console.log('Error connection', arguments);
            });

            /**
             * Входящие сообщения.
             */
            socket.on('message', function(message) {
                this.sendMessage(jQuery('#ocName').text(), message, true, window.ONLINE_CONSULT_GROUP_ALIAS || null);
            }.bind(this));

            /**
             * Вернет менеджера.
             */
            socket.on('get_manager', function(manager) {
                jQuery('img', '#ocManager').attr('src', manager.img);
                jQuery('#ocName').text(manager.name);
                jQuery('#ocPos').text(manager.pos);

                socket.emit('get_manager_status');
            });

            /**
             * Вернет статус менеджера.
             */
            socket.on('get_manager_status', function(status) {
                //jQuery('#ocStatus').text(status === 'online' ? 'онлайн' : 'офлайн');
                //jQuery('#ocSendMessage').prop('disabled', status !== 'online');
                if (status === 'online') {
                    jQuery('#ocStatus').text('онлайн');
                    jQuery('#ocSendMessage').prop('disabled', false);
                }
                else {
                    //  TODO: Временное решение пока нету офлайн отправки сообщений.
                    jQuery('#ocStatus').text('офлайн');
                    jQuery('#ocSendMessage').prop('disabled', true);
                    jQuery('#ocClose').click();
                }
            });

            //  Кадие 5 секунд проверяем статус менеджера.
            //  FIXME: Возможно дублирование таймеров если произойдет переподключение.
            setInterval(function() {
                socket.emit('get_manager_status');
            }, 5000);

            callback();
        }.bind(this));
    };

    /**
     * Отправит сообщение.
     * @param {String} name
     * @param {String} message
     * @param {Boolean} isIncoming (опционально)
     * @param {String|Number} groupId
     */
    this.sendMessage = function(name, message, isIncoming, groupId) {
        if (!message || !message.length || !socket.connected) {
            return false;
        }

        this.addMessage(name, message, isIncoming);
        this.addHistory(+new Date(), name, groupId, message, isIncoming);

        if (isIncoming) {
            incoming.play();
        }
        else {
            jQuery('textarea', '#ocMsgForm').val('').focus();
            socket.emit('message', message);
        }
    };

    /**
     * Добавит сообщение в чат.
     * @param {String} name
     * @param {String} message
     * @param {Boolean} isIncoming (опционально)
     */
    this.addMessage = function(name, message, isIncoming) {
        if (!message || !message.length) {
            return false;
        }

        $('.oc-messages-content').append(isIncoming ?
            ('<li class="oc-msg-manager"><strong>' + name + ':</strong> ' + message + '</li>') :
            ('<li><strong>Вы:</strong> ' + message + '</li>'));
    };

    /**
     * Вернет новый или сгенерированный идентификатор пользователя.
     * @param {Function} callback
     */
    this.getUserId = function(callback) {
        jQuery.ajax({
            dataType: 'jsonp',
            jsonp: 'callback',
            url: 'http://' + hostName + '/register/?callback=?',
            success: function(data) {
                callback(null, data.uid);
            }
        });
    };

    /**
     * Вернет локальную историю переписки клиента с менеджером.
     * @return {Object}
     */
    this.getHistory = function() {
        try {
            return JSON.parse(localStorage.getItem('ocHistory') || '{}');
        }
        catch (e) {
            return {};
        }
    };

    /**
     * Добавит запись в локальную историю переписки клиента с менеджером.
     * @param {String} time
     * @param {String} name
     * @param {String} groupId
     * @param {String} message
     * @param {Boolean} isManager
     */
    this.addHistory = function(time, name, groupId, message, isManager) {
        try {
            var history = this.getHistory();
            history[time] = {
                name: name || '',
                groupId: groupId || null,
                message: message || '',
                isManager: isManager || false
            };
            localStorage.setItem('ocHistory', JSON.stringify(history));
        }
        catch (e) {
        }
    };
};

/**
 * Вызывается при открытии диалога переписки.
 */
OnlineConsult.prototype.onOpen = function() {
    //  TODO: Временное решение пока скрывать окно, если менеджер не в сети.
    if (jQuery('#ocStatus').text() !== 'офлайн') {
        jQuery(this).hide().closest('.onlineconsult').find('.oc-window').fadeIn();
    }
    return false;
};

/**
 * Вызывается при закрытии диалога переписки.
 */
OnlineConsult.prototype.onClose = function() {
    jQuery('.oc-window', '.onlineconsult').hide();
    jQuery('#ocOpen').fadeIn();
    return false;
};

/**
 * Запуск
 */
if (jQuery) {
    jQuery(function() {
        window.oc = new OnlineConsult(window.ONLINE_CONSULT_HOST_NAME);
        window.oc.connect(function() {
            window.oc.init();
        });
    });
}