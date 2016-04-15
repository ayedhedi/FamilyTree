'use strict';

const Hapi = require('hapi');
const Code = require('code');
const Lab = require('lab');
const Path = require('path');
const Server = require('../lib/index');
const About = require('../lib/api/about/index');
const Person = require('../lib/api/person/index');
const Dao = require('../lib/dao/index');

// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const it = lab.test;
const describe = lab.experiment;


describe('server', () => {


    it('starts server and returns hapi server object', (done) => {

        const manifest = {};
        const options = {};

        Server.init(manifest, options, (err, server) => {

            expect(err).to.not.exist();
            expect(server).to.be.instanceof(Hapi.Server);

            server.stop(done);
        });
    });



    it('starts server on provided port', (done) => {

        const manifest = {
            connections: [
                {
                    port: 5000
                }
            ]
        };
        const options = {};

        Server.init(manifest, options, (err, server) => {

            expect(err).to.not.exist();
            expect(server.info.port).to.equal(5000);

            server.stop(done);
        });
    });


    it('handles register plugins errors', { parallel: false }, (done) => {

        internals.plugins.map( (Plugin) => {

            const orig = Plugin.register;
            Plugin.register = function (server, options, next) {

                Plugin.register = orig;
                return next(new Error('register failed'));
            };

            Plugin.register.attributes = {
                name: 'fake plugin'
            };

            Server.init(internals.manifest, internals.composeOptions, (err) => {

                expect(err).to.exist();
                expect(err.message).to.equal('register failed');

                done();
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
                plugin: './api/about/index'
            },
            {
                plugin: './api/person/index'
            },
            {
                plugin: './dao/index'
            }
        ]
    };

    internals.composeOptions = {
        relativeTo: Path.resolve(__dirname, '../lib')
    };

    internals.plugins = [About, Dao, Person];


});

