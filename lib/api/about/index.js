'use strict';

// Load modules

const Package = require('../../../package.json');


// Declare internals

const internals = {
    response: {
        name: Package.name,
        version: Package.version,
        description: Package.description,
        author: Package.author,
        license: Package.license
    }
};


exports.register = (server, options, next) => {

    server.route({
        method: 'GET',
        path: '/about',
        config: {
            description: 'Returns the about of the app',
            handler: function (request, reply) {

                return reply(internals.response);
            }
        }
    });

    return next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
