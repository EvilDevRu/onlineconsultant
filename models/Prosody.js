/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var Sequelize = Nyama.app().db.Sequelize;

module.exports = {
    model: 'Prosody',
    columns: {
        host: Sequelize.TEXT,
        user: Sequelize.TEXT,
        store: Sequelize.TEXT,
        key: Sequelize.TEXT,
        type: Sequelize.TEXT,
        value: Sequelize.TEXT
    },
    options: {
        tableName: 'prosody',
        timestamps: false,
        /**
         * Статические методы.
         */
        classMethods: {
            /**
             * Создание нового пользователя.
             * @param {String} login логин пользователя.
             * @param {String} password пароль (опционально).
             */
            createUser: function(login, password) {
                this.removeAttribute('id'); //  Без первичного ключа.
                return this.create({
                    host: Nyama.app().jabber.getHost(),
                    user: login,
                    store: 'accounts',
                    key: 'password',
                    type: 'string',
                    value: Nyama.app().jabber.getDefaultPassword()
                });
            }
        },

        /**
         * Методы экземпляра.
         */
        instanceMethods: {
        }
    }
};