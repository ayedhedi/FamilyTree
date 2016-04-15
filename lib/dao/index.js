'use strict';

const Seraph = require('seraph');
const Operations = require('./lib/dbOperations');

const internals = {};


exports.register = (server, options, next) => {

    server.dependency('config', internals.after);
    server.expose('personReadFirst25', internals.readSamplePersons);
    server.expose( 'savePerson', internals.savePerson);

    return next();
};


exports.register.attributes = {
    pkg: require('./package.json')
};

internals.after = (server, next) => {
    //get configs
    const Config = server.plugins.config;

    //set connection
    internals.conn = Seraph(
        {
            server: Config.get('server', 'db'),
            user: Config.get('user', 'db'),
            pass: Config.get('pass', 'db')
        }
    );

    //the end
    return next();
};

internals.readSamplePersons = () => {
  return Operations.readSamplePersons(internals.conn);
};

internals.savePerson = (person) => {
    return Operations.savePerson(internals.conn, person);
};