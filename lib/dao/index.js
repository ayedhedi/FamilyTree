'use strict';

const Seraph = require('seraph');
const PersonOps = require('./lib/personOps');
const ParentOps = require('./lib/parentOps');

const internals = {};


exports.register = (server, options, next) => {

    server.dependency('config', internals.after);
    server.expose( 'savePerson', internals.savePerson);
    server.expose( 'deletePerson', internals.deletePerson);
    server.expose( 'createParent', internals.createParent);

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

    //set plugin config to ParentOps
    ParentOps.setConfigPlugin(Config);

    //the end
    return next();
};


internals.savePerson = (person) => {
    return PersonOps.save(internals.conn, person);
};

internals.findById = (id) => {
    return PersonOps.findById(internals.conn, id);
};

internals.deletePerson = (id) => {
    return PersonOps.remove(internals.conn, id);
};

internals.createParent = (personId, parentId) => {
    return ParentOps.create(internals.conn, personId, parentId);
};
