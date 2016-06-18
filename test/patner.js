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

const expect = Code.expect;

const internals = {
    persons: [],
    savePerson: (person) => {
        return internals.dao.savePerson(person).then(

            (_person) => {
                internals.persons[_person.firstName] = _person;
            },
            () => {
                Code.fail("Cannot create person "+person);
            }
        );
    }
};

lab.experiment('partners', () => {

    //init the server
    lab.before((done) => {

        Server.init(internals.manifest, internals.composeOptions, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.dao).to.exist();

            internals.dao = server.plugins.dao;
            internals.server = server;
            done();
        });

    });

    /**
     *        A     K
     *       _|_   _|_
     *    D-B   C-E   L
     *  / \/    \/ \ /\
     * H  F     G  I M N
     *
     */
    lab.test('init: create the tree.', () => {

        //creates the persons
        const tabNames = ['A','B','C','D','E','F','G','H','I','K','L','M','N'];
        const tabGends = ['M','M','F','F','M','F','M','M','F','F','M','M','F'];
        const funcTab = [];
        for (let i=0;i<tabGends.length;i++) {

            const person = Generator.validPerson();
            person.firstName = person.lastName = tabNames[i];
            person.gender = tabGends[i] ;

            funcTab.push(internals.savePerson(person));
        }

        //save persons
        return Q.allSettled(funcTab).then(

            () => {
                //create relations
                const funcTab = [];
                // B -child_of- A
                funcTab.push(internals.dao.createParent(internals.persons['B'].id, internals.persons['A'].id));
                // C -child_of- A
                funcTab.push(internals.dao.createParent(internals.persons['C'].id, internals.persons['A'].id));
                // F -child_of- B and D
                funcTab.push(internals.dao.createParent(internals.persons['F'].id, internals.persons['B'].id));
                funcTab.push(internals.dao.createParent(internals.persons['F'].id, internals.persons['D'].id));
                //G -child_of- C and E
                funcTab.push(internals.dao.createParent(internals.persons['G'].id, internals.persons['E'].id));
                funcTab.push(internals.dao.createParent(internals.persons['G'].id, internals.persons['C'].id));
                //D -partner_of- B
                funcTab.push(internals.dao.createPartner(internals.persons['D'].id, internals.persons['B'].id));
                //E -partner_of- C
                funcTab.push(internals.dao.createPartner(internals.persons['C'].id, internals.persons['E'].id));
                // H -child_of- D (and not of B)
                funcTab.push(internals.dao.createParent(internals.persons['H'].id, internals.persons['D'].id));
                // I -child_of- E (and not of C)
                funcTab.push(internals.dao.createParent(internals.persons['I'].id, internals.persons['E'].id));
                // E -child_of- K
                funcTab.push(internals.dao.createParent(internals.persons['E'].id, internals.persons['K'].id));
                // L -child_of- K
                funcTab.push(internals.dao.createParent(internals.persons['L'].id, internals.persons['K'].id));
                // M -child_of- L
                funcTab.push(internals.dao.createParent(internals.persons['M'].id, internals.persons['L'].id));
                // N -child_of- L
                funcTab.push(internals.dao.createParent(internals.persons['N'].id, internals.persons['L'].id));

                return Q.allSettled(funcTab);
            },
            () => {
                Code.fail("Cannot create nodes ");
            }
        );

    });

    const relations = ["grandParents", "childrens", "grandchildrens", "spouses", "siblings", "daughtersInLaw", "sonsInLaw", "fathersInLaw", "mothersInLaw"];
    const persons = ['F','A','A','B','H','A','A','D','C'];
    const parents = ['A','B','F','D','F','D','E','A','K'];

    for(var i=0;i<relations.length;i++){
        const person = persons[i];
        const parent = parents[i];
        const relation = relations[i];

        lab.test(relation, () => {
            return internals.dao.createPartner(internals.persons[person].id, internals.persons[parent].id).then(
                () => {
                    Code.fail(person+" cannot be the partner of "+parent+". Relation:"+relation);
                },
                (err) => {
                    //rules are not respected: -13
                    expect(err.message).to.equal("-13");
                }
            )
        })
    }



    //stop the server
    lab.after((done) => {
        //remove all nodes
        const funcTab = [];
        internals.persons.map( (person) => {

            funcTab.push(internals.dao.deletePerson(person.id));
        });
        Q.allSettled(funcTab).then(

            () => {
                internals.server.stop(done);
            },
            () => {
                Code.fail("Failed to delete persons");
                internals.server.stop(done);
            }
        );

        //internals.server.stop(done);
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

