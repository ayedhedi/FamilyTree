'use strict';

const Seraph = require('seraph');
const PersonOps = require('./lib/personOps');
const ParentOps = require('./lib/parentOps');
const PartnerOps = require('./lib/partnerOps');
const RelationOps = require('./lib/relationOps');

const internals = {};


exports.register = (server, options, next) => {

    server.dependency('config', internals.after);
    server.expose( 'savePerson', internals.savePerson);
    server.expose( 'findPerson', internals.findPerson);
    server.expose( 'findPersonFirstName', internals.findPersonFirstName);
    server.expose( 'deletePerson', internals.deletePerson);
    server.expose( 'createParent', internals.createParent);
    server.expose( 'readParents', internals.readParents);
    server.expose( 'createPartner', internals.createPartner);
    server.expose( 'readPartners', internals.readPartners);
    server.expose( 'getRelation', internals.getRelation);

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
    PartnerOps.setConfigPlugin(Config);

    //the end
    return next();
};


internals.savePerson = (person) => {
    return PersonOps.save(internals.conn, person);
};

internals.findPerson = (id) => {
    return PersonOps.findById(internals.conn, id);
};

internals.findPersonFirstName = (firstName, limit) => {
    return PersonOps.findByFirstName(internals.conn, firstName, limit);
};

internals.deletePerson = (id) => {
    return PersonOps.remove(internals.conn, id);
};

internals.createParent = (personId, parentId) => {
    return ParentOps.create(internals.conn, personId, parentId);
};

internals.readParents = (personId) => {
    return ParentOps.find(internals.conn, personId);
};

internals.createPartner = (personId, partnerId) => {
    return PartnerOps.create(internals.conn, personId, partnerId);
};

internals.readPartners = (personId) => {
    return PartnerOps.find(internals.conn, personId);
};

internals.getRelation = (relation, personId) => {
    return RelationOps.get(internals.conn, relation, personId);
};