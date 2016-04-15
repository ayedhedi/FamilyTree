'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Path = require('path');
const Package = require('../package.json');
const Server = require('../lib/index');

// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;


describe('/about', () => {

    it('returns the correct about content from package.json', (done) => {

        Server.init(internals.manifest, internals.composeOptions, (err, server) => {

            expect(err).to.not.exist();
            server.inject('/about', (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.deep.equal(
                    {
                        name: Package.name,
                        version: Package.version,
                        description: Package.description,
                        author: Package.author,
                        license: Package.license
                    });

                server.stop(done);
            });
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
        }
    ]
};

internals.composeOptions = {
    relativeTo: Path.resolve(__dirname, '../lib')
};
