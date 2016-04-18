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


lab.experiment('dao', () => {

    //init the server
    lab.before((done) => {

        Server.init(internals.manifest, internals.composeOptions, (err, server) => {

            expect(err).to.not.exist();
            expect(server.plugins.dao).to.exist();

            internals.server = server;
            internals.daoPlugin = server.plugins.dao;
            internals.configPlugin = server.plugins.config;
            done();
        });

    });


    lab.test('save and delete a person ', () => {

        const person = Generator.validPerson();
        return internals.server.plugins.dao.savePerson(person).then(

            (_person) => {
                expect(_person).exist();
                expect(_person.id).exist();
                internals.idPerson = _person.id;
                return internals.daoPlugin.deletePerson(internals.idPerson);
            }
        ).then(
            () => {},
            () => {
                Code.fail("Cannot delte person ");
            }
        )

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
                return internals.daoPlugin.savePerson(parent);
            }
        ).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                internals.idPartner = _person.id;
                //creates the relation now
                return internals.daoPlugin.createParent(internals.idPerson, internals.idPartner);
            }
        ).then(

            (relation_id) => {

                expect(relation_id).to.be.greaterThan(0);
                return internals.daoPlugin.readParents(internals.idPerson);
            }
        ).then(

            (parents) => {

                expect(parents).to.be.an.array();
                expect(parents.length).to.equal(1);
                expect(parents[0].id).to.equal(internals.idPartner);

                //delete the person
                return internals.daoPlugin.deletePerson(internals.idPerson);
            }
        ).then(

            () => {
                //delete the parent
                return internals.daoPlugin.deletePerson(internals.idPartner);
            }
        )

    });

    lab.test('fails to create relation with undefined person ', () => {


        return internals.daoPlugin.createParent(internals.idPerson, internals.idPartner).then(
            () => {
                Code.fail("Should throw error: cannot create relation.")
            },
            (err) => {
                expect(err.message).to.equal("-1");
            }
        )

    });

    lab.test('fails to create relation: parent and person should be different (rule -11) ', () => {

        const person = Generator.validPerson();
        //save person
        return internals.daoPlugin.savePerson(person).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                internals.idPerson = _person.id;
                //save parent now
                return internals.daoPlugin.createParent(internals.idPerson, internals.idPerson);
            }
        ).then(

            () => {
                Code.fail("Should throw error: person with now deleted ")
            },
            (err) => {
                expect(err.message).to.equal("-11");
                //now remove the person
                return internals.daoPlugin.deletePerson(internals.idPerson);
            }
        ).then(
            () => {
                expect(true).to.equal(true);
            },
            () => {
                Code.fail("Cannot delete the person");
            }
        )

    });


    lab.test('fails to create parents; should respect max number of parents (rule -12)', () => {

        //the first will be the person and the rest as parent (wich is not acceptable)
        const maxParents = internals.configPlugin.get('maxParents', 'rules') + 2;

        //save or fail test
        const save = (person) => {

            return internals.daoPlugin.savePerson(person).then(

                (_person) => {
                    return _person.id;
                },
                () => {
                    Code.fail("Cannot create person "+person);
                }
            );
        };


        //create the list of promises to be used with Q.allSettled
        const tab = [];
        for (let i=0;i<maxParents;i++) {
            let p = Generator.validPerson();
            tab.push(save(p));
        }


        return Q.allSettled(tab).then(
            (values) => {

                internals.idTabs = [];
                values.map( (q) => {

                    if (q.state !== 'fulfilled') {
                        Code.fail("Cannot save one person !!");
                    }

                    internals.idTabs.push(q.value);
                });

                //create the list of promises to be used with Q.allSettled
                const tab = [];
                for (let i=1;i<maxParents-1;i++) {
                    tab.push(internals.daoPlugin.createParent(internals.idTabs[0], internals.idTabs[i]));
                }
                return Q.allSettled(tab);
            }
        ).then(

            () => {

                //next realtion should be refused
                return internals.daoPlugin.createParent(internals.idTabs[0], internals.idTabs[maxParents-1]);
            }
        ).then(

            () => {
                if (maxParents != 2)
                {
                    Code.fail("Should throw error: max number of parents reached")
                }
            },
            (err) => {
                expect(err.message).to.equal("-12");
                //now remove all created persons

                const tab = [];
                for (let i=0;i<maxParents;i++) {
                    tab.push(internals.daoPlugin.deletePerson(internals.idTabs[i]));
                }
                return Q.allSettled(tab);
            }
        ).then(
            () => {},
            () => {
                Code.fail("Cannot delete all created persons !!");
            }
        );

    });



    lab.test('successfully creates a partner relation ', () => {

        const person = Generator.validPerson();
        const partner = Generator.validPerson();

        //save person
        return internals.server.plugins.dao.savePerson(person).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                internals.idPerson = _person.id;
                //save partner now
                return internals.daoPlugin.savePerson(partner);
            }
        ).then(

            (_person) => {

                expect(_person).exist();
                expect(_person.id).exist();
                internals.idPartner = _person.id;
                //creates the relation now
                return internals.daoPlugin.createPartner(internals.idPerson, internals.idPartner);
            }
        ).then(

            (relation_id) => {

                expect(relation_id).to.be.greaterThan(0);
                return internals.daoPlugin.readPartners(internals.idPerson);
            }
        ).then(

            (partners) => {

                expect(partners).to.be.an.array();
                expect(partners.length).to.equal(1);
                expect(partners[0].id).to.equal(internals.idPartner);

                //delete the person
                return internals.daoPlugin.deletePerson(internals.idPerson);
            }
        ).then(

            () => {
                //delete the partner
                return internals.daoPlugin.deletePerson(internals.idPartner);
            }
        )

    });

    lab.test('fails to create partners; should respect max number of partners (rule -12)', () => {

        //the first will be the person and the rest as parent (wich is not acceptable)
        const maxPartners = internals.configPlugin.get('maxPartners', 'rules') + 2;

        //save or fail test
        const save = (person) => {

            return internals.daoPlugin.savePerson(person).then(

                (_person) => {
                    return _person.id;
                },
                () => {
                    Code.fail("Cannot create person "+person);
                }
            );
        };


        //create the list of promises to be used with Q.allSettled
        const tab = [];
        for (let i=0;i<maxPartners;i++) {
            let p = Generator.validPerson();
            tab.push(save(p));
        }


        return Q.allSettled(tab).then(
            (values) => {

                internals.idTabs = [];
                values.map( (q) => {

                    if (q.state !== 'fulfilled') {
                        Code.fail("Cannot save one person !!");
                    }

                    internals.idTabs.push(q.value);
                });

                //create the list of promises to be used with Q.allSettled
                const tab = [];
                for (let i=1;i<maxPartners-1;i++) {
                    tab.push(internals.daoPlugin.createPartner(internals.idTabs[0], internals.idTabs[i]));
                }
                return Q.allSettled(tab);
            }
        ).then(

            () => {

                //next realtion should be refused
                return internals.daoPlugin.createPartner(internals.idTabs[0], internals.idTabs[maxPartners-1]);
            }
        ).then(

            () => {
                //can create only if max = 0 --> unlimited
                if (maxPartners != 2) {
                    Code.fail("Should throw error: max number of partners reached")
                }
            },
            (err) => {
                expect(err.message).to.equal("-12");
                //now remove all created persons

                const tab = [];
                for (let i=0;i<maxPartners;i++) {
                    tab.push(internals.daoPlugin.deletePerson(internals.idTabs[i]));
                }
                return Q.allSettled(tab);
            }
        ).then(
            () => {},
            () => {
                Code.fail("Cannot delete all created epersons !!");
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

