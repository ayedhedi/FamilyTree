'use strict';

// Load modules

const Hoek = require('hoek');
const Server = require('./index');


// Declare internals

const internals = {};

internals.manifest = {
    connections: [
        {
            port: 8000
        }
    ],
    registrations: [
        {
            plugin: './api/about/index'
        },
        {
            plugin: './api/person/index'
        },
        {
            plugin: './dao/index'
        },
        {
            plugin: './config/index'
        }
    ]
};

internals.composeOptions = {
    relativeTo: __dirname
};

Server.init(internals.manifest, internals.composeOptions, (err, server) => {

    Hoek.assert(!err, err);
    console.log('Server started at: ' + server.info.uri);
    console.log(server.plugins);
});
