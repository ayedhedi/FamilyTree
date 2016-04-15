'use strict';

const Seraph = require('seraph');
const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const DbOperations = require('../lib/dao/lib/dbOperations');
const Generator = require('./dataGenerator');
const TestConfigs = require('./resources/configs.json');

const expect = Code.expect;

const internals = {};


lab.experiment('math', () => {


    lab.before((done) => {

        internals.conn = Seraph(
            {
                server: TestConfigs.dbServer,
                user: TestConfigs.dbUser,
                pass: TestConfigs.dbPass
            }
        );

        done();
    });


    lab.test('exposes the personReadFirst25 function and works correct', () => {

        return DbOperations.readSamplePersons(internals.conn).then(

            (result) => {

                expect(result).to.exist();
                expect(result).to.be.array();
            }
        )
    });

    var idPerson;
    lab.test('creates and save a new person', () => {

        const person = Generator.validPerson();

        return DbOperations.savePerson(internals.conn, person).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                idPerson = _person.id;
            }
        );
    });

    lab.test('delte created person ', () => {

        expect(idPerson).to.exist();

        return DbOperations.deletePerson(internals.conn, idPerson).then(

            (deleted) => {

                expect(deleted).to.equal(true);
            }
        )
    });
    
});
