/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var Sequelize = Nyama.app().db.Sequelize;

module.exports = {
    model: 'Users',
    columns: {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        group_id: Sequelize.INTEGER,
        login: {
            type: Sequelize.STRING,
            allowNull: false,
            length: 12
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            length: 16
        },
        position: {
            type: Sequelize.STRING,
            allowNull: false,
            length: 16
        },
        date_create: {
            type: Sequelize.DATE
        },
        date_update: {
            type: Sequelize.DATE
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    },
    options: {
        tableName: 'users',
        createdAt: 'date_create',
        updatedAt: 'date_update',
        /**
         * Статические методы.
         */
        classMethods: {
            /**
             * Создание нового пользователя.
             * @param {String} login логин пользователя.
             * @param {String} name отображаемое имя.
             * @param {String} position отображаемая должность.
             * @param {Number} groupId список групп.
             * @param {Boolean} isActive может ли пользователь использовать систему.
             */
            createUser: function(login, name, position, groupId, isActive) {
                var defer = _.Q.defer();

                this
                    .create({
                        group_id: groupId,
                        login: login,
                        name: name,
                        position: position,
                        is_active: isActive || false
                    })
                    .done(function(error, user) {
                        if (error) {
                            defer.resolve(null);
                            return;
                        }

                        //  Создаем аккаунт на Jabber сервере.
                        Nyama.app().db
                            .getModel('Prosody')
                            .createUser(login)
                            .done(function(error, model) {
                                if (error) {
                                    console.error(error);
                                    user.destroy();
                                    defer.resolve(null);
                                    return;
                                }

                                //  Передаем модель пользователя.
                                defer.resolve(user);
                            });
                    });

                return defer.promise;
            }
        },

        /**
         * Методы экземпляра.
         */
        instanceMethods: {
        }
    }
};