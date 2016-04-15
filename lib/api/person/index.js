'use strict';

const Validator = require('../validator/index');

// Declare internals
const internals = {};


exports.register = (server, options, next) => {

    server.dependency('dao', internals.after);
    return next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};


internals.after = (server, next) => {

    server.route({
        method: 'GET',
        path: '/person',
        config: {
            description: 'Read persons; default is first 25 persons ',
            handler:  (request, reply) => {

                server.plugins.dao.personReadFirst25().then((result) => {

                    return reply(result);
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/person',
        config: {
            description: 'Add new person to the Tree',
            validate: {
                payload: Validator.validateInputPerson
            },
            handler: (request, reply) => {

                console.log(request.query.p);
                return reply();
            }
        }
    });

    return next();
};



