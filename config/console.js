/**
 * @author Dmitriy Yurchenko <evildev@evildev.ru>
 * @copyright Copyright (c) Dmitriy Yurchenko <evildev@evildev.ru>, 2015
 * @license MIT
 */

module.exports = {
    basePath: __dirname + '/../',
    components: {
        db: require('./database.json'),
        jabber: require('./jabber.json'),
        server: {
            host: 'consult.hitrade.local',
            port: 8080
        }
    }
};