/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

'use strict';

var Sequelize = Nyama.app().db.Sequelize;

module.exports = {
    model: 'UsersGroupsRelation',
    columns: {
        group_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
        }
    },
    options: {
        tableName: 'users_groups_relation',
        timestamps: false
    }
};