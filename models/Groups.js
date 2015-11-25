/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var Sequelize = Nyama.app().db.Sequelize;

module.exports = {
    model: 'Groups',
    columns: {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            length: 16
        },
        alias: {
            type: Sequelize.STRING,
            allowNull: false,
            length: 16
        }
    },
    options: {
        tableName: 'groups',
        timestamps: false,

        /**
         * Методы экземпляра.
         */
        instanceMethods: {
            /**
             * Вернет пользователей в группе.
             * FIXME: Перести все в связи и сделать многие ко многим.
             */
            getUsers: function() {
                return Nyama.app().db.getModel('Users').findAll({ where: { group_id: this.id } });
            }
        }
    }
};