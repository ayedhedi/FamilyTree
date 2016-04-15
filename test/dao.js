'use strict';

const Seraph = require('seraph');
const Code = require('code');   // assertion library
const Lab = require('lab');
const Path = require('path');
const lab = exports.lab = Lab.script();
const Server = require('../lib/index');
const Package = require('../package.json');


const Generator = require('./dataGenerator');
const TestConfigs = require('./resources/configs.json');

const expect = Code.expect;

const internals = {};


lab.experiment('dao', () => {

    //init the server
    lab.before((done) => {

        Server.init(internals.manifest, internals.composeOptions, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.dao).to.exist();

            internals.server = server;
            done();
        });

    });


    lab.test('create and save a person ', () => {

        const person = Generator.validPerson();
        return internals.server.plugins.dao.savePerson(person).then((_person) => {

            expect(_person).exist();
            expect(_person.id).exist();
            internals.idPerson = _person.id;
            }
        );

    });


    lab.test('delete previously created person ', () => {

        expect(internals.idPerson).to.exist();
        return internals.server.plugins.dao.deletePerson(internals.idPerson).then(

            (deleted) => {

                expect(deleted).to.equal(true);
            }
        );
    });

    lab.test('successfully creates a parent relation ', () => {

        const person = Generator.validPerson();
        const parent = Generator.validPerson();

        //save person
        return internals.server.plugins.dao.savePerson(person).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                internals.idPerson = _person.id;
                //save parent now
                return internals.server.plugins.dao.savePerson(parent);
            }
        ).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                internals.idParent = _person.id;
                //creates the relation now
                return internals.server.plugins.dao.createParent(internals.idPerson, internals.idParent);
            }
        ).then(

            (relation_id) => {
                expect(relation_id).to.be.greaterThan(0)
            }
        );

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

