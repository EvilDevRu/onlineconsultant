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
                        '<div class="pull-right"><span class="btn-oc" id="ocHide">_</span></div>' +
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
                //  TODO: Временное решение пока скрывать окно, если менеджер не в сети.
                if ($('#ocStatus').text() !== 'офлайн') {
                    $(this).hide().closest('.onlineconsult').find('.oc-window').fadeIn();
                }
                return false;
            })
        /**
         * Скроет диалог.
         */
            .on('click', '#ocHide', function() {
                jQuery('.oc-window', '.onlineconsult').hide();
                jQuery('#ocOpen').fadeIn();
                return false;
            })
        /**
         * Отправка сообщения.
         */
            .on('submit', '#ocMsgForm', function() {
                _this.sendMessage(jQuery(this).find('textarea').val());
                return false;
            });
    };

    /**
     * Соединится с сервером.
     */
    this.connect = function() {
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
                console.log('Что то пошло не так.');
                return;
            }

            userId = id;
            socket = io.connect('ws://' + hostName, { jsonp: false });


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
                this.sendMessage(message, true);
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
                    jQuery('#ocHide').click();
                }
            });

            //  Кадие 5 секунд проверяем статус менеджера.
            //  FIXME: Возможно дублирование таймеров если произойдет переподключение.
            setInterval(function() {
                socket.emit('get_manager_status');
            }, 5000);
        }.bind(this));
    };

    /**
     * Отправит сообщение.
     * @param {String} message
     * @param {Boolean} isIncoming (опционально)
     * @return {Boolean}
     */
    this.sendMessage = function(message, isIncoming) {
        if (!message || !message.length || !socket.connected) {
            return false;
        }

        var $c = $('.oc-messages-content');

        if (isIncoming) {
            $c.append('<li class="oc-msg-manager"><strong>' + jQuery('#ocName').text() + ':</strong> ' + message + '</li>');
            incoming.play();
        }
        else {
            $c.append('<li><strong>Вы:</strong> ' + message + '</li>');
            jQuery('textarea', '#ocMsgForm').val('').focus();
            socket.emit('message', message);
        }
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
     * Установит имя группы.
     * @param {String} name
    this.setGroupName = function(name) {
        //  TODO: Переустанавливать соединение на новую группу без перезагрузки.
        groupName = name;
    };
     */
};

/**
 * Запуск
 */
if (jQuery) {
    jQuery(function() {
        var consultInstance = new OnlineConsult(window.ONLINE_CONSULT_HOST_NAME);
        consultInstance.init();
        consultInstance.connect();
    });
}