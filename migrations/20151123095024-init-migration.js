'use strict';

module.exports = {
    /**
     * @param queryInterface
     * @param Sequelize
     */
    up: function (queryInterface, Sequelize) {
        /**
         * Таблица пользователей (менеджеров)
         */
        queryInterface.createTable('users', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            group_id: {
                type: Sequelize.INTEGER
            },
            login: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
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
        });

        /**
         * Таблица групп (например городов)
         */
        queryInterface.createTable('groups', {
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
        });

        /**
         * Таблица связивающая группы и пользователей.
         * Например один менеджер может обслуживать 2 группы.
         */
        /*queryInterface.createTable('users_groups_relation', {
            group_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            }
        });*/

        //  Индексы.
        /*queryInterface.addIndex('users_groups_relation', ['group_id', 'user_id'], {
            indexName: 'users_groups_relation_index',
            indicesType: 'UNIQUE'
        });*/
    },

    /**
     * @param queryInterface
     * @param Sequelize
     */
    down: function (queryInterface, Sequelize) {
        //queryInterface.removeIndex('users_groups_relation', 'users_groups_relation_index');
        //queryInterface.dropTable('users_groups_relation');
        queryInterface.dropTable('users');
        queryInterface.dropTable('groups');
    }
};
