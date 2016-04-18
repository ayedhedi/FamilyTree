'use strict';

const Seraph = require('seraph');
const Code = require('code');   // assertion library
const Lab = require('lab');
const Path = require('path');
const Q = require('q');
const lab = exports.lab = Lab.script();
const Server = require('../lib/index');
const Package = require('../package.json');


const Generator = require('./dataGenerator');
const TestConfigs = require('./resources/configs.json');

const expect = Code.expect;

const internals = {};


lab.experiment('relations', () => {

    //init the server
    lab.before((done) => {

        Server.init(internals.manifest, internals.composeOptions, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.dao).to.exist();

            internals.server = server;
            internals.daoPlugin = server.plugins.dao;
            internals.configPlugin = server.plugins.config;

            //create the needed tree by tests



            done();
        });

    });




    //stop the server
    lab.after((done) => {

        internals.server.stop(done);
    });


});



internals.manifest = {
    connections: [
        {
            port: 0
        }
    ],
    registrations: [
        {
            plugin: './config/index'
        },
        {
            plugin: './dao/index'
        }
    ]
};

internals.composeOptions = {
    relativeTo: Path.resolve(__dirname, '../lib')
};

