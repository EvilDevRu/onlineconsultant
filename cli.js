/**
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

    switch (process.argv[2]) {
        case 'adduser':
            if (process.argv.length !== 8) {
                return;
            }

            console.log('Add new user');

            yield app.db.getModel('Users').createUser(
                process.argv[3],
                process.argv[4],
                process.argv[5],
                process.argv[6],
                true
            );
            break;

        case 'addgroup':
            if (process.argv.length !== 5) {
                return;
            }

            console.log('Add new group');

            yield app.db.getModel('Groups').create({
                name: process.argv[3],
                alias: process.argv[4]
            });
            break;

        case 'addjabber':
            if (process.argv.length < 4) {
                return;
            }

            console.log('Add new jabber account');

            yield app.db.getModel('Prosody').createUser(process.argv[3], process.argv[4]);
            break;

        default:
            console.log('cli.js command params...');
            console.log('COMMANDS:');
            console.log('adduser login name position groupId password');
            console.log('addgroup name alias');
            console.log('addjabber name [password]');
            process.exit(0);
            break;
    }

    process.exit();
});