'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Path = require('path');
const Server = require('../lib/index');
const Db = require('../lib/config/lib/db');
const Validator = require('../lib/config/lib/validator');

// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;


describe('configurations', () => {

    it('load parameters ', (done) => {

        Server.init(internals.manifest, internals.composeOptions, (err, server) => {

            expect(err).to.not.exist();

            let pluginConf = server.plugins.config;
            expect(pluginConf).to.exist();


            Object.keys(Db).forEach((key) => {
                let value = pluginConf.get(key, 'db');
                expect(value).to.equal(Db[key]);
            });

            Object.keys(Validator).forEach((key) => {
                let value = pluginConf.get(key, 'validator');
                expect(value).to.equal(Validator[key]);
            });

            server.stop(done);
        });
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
        }
    ]
};

internals.composeOptions = {
    relativeTo: Path.resolve(__dirname, '../lib')
};
