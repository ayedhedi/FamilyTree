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


lab.experiment('relations', () => {

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

    lab.test('grand parent', () => {
        //the grandparent of F is A, of G is A and K. Also H has no grandparent
        return internals.dao.getRelation('grandParents', internals.persons['F'].id).then(

            (grandParents) => {

                expect(grandParents).to.be.an.array();
                expect(grandParents.length).to.equal(1);
                expect(grandParents[0].id).to.equal(internals.persons['A'].id);

                return internals.dao.getRelation('grandParents', internals.persons['G'].id)
            }
        ).then(

            (grandParents) => {

                expect(grandParents).to.be.an.array();
                expect(grandParents.length).to.equal(2);
                expect([grandParents[0].id,grandParents[1].id]).to.once.include([internals.persons['A'].id,internals.persons['K'].id]);

                return internals.dao.getRelation('grandParents', internals.persons['H'].id);
            }
        ).then(

            (grandParents) => {

                expect(grandParents).to.be.an.array();
                expect(grandParents.length).to.equal(0);
            },
            (err) => {
                Code.fail(err.message);
            }
        );
    });

    lab.test('childrens', () => {

        //B and C are the uique childrens of A; F anf H are thoses of D; Also 'I' has no childrens
        return internals.dao.getRelation('childrens', internals.persons['A'].id).then(

            (childrens) => {

                expect(childrens).to.be.an.array();
                expect(childrens.length).to.equal(2);
                expect([childrens[0].id,childrens[1].id]).to.once.include([internals.persons['B'].id,internals.persons['C'].id]);

                return internals.dao.getRelation('childrens', internals.persons['D'].id);
            }
        ).then(

            (childrens) => {

                expect(childrens).to.be.an.array();
                expect(childrens.length).to.equal(2);
                expect([childrens[0].id,childrens[1].id]).to.once.include([internals.persons['F'].id,internals.persons['H'].id]);

                return internals.dao.getRelation('childrens', internals.persons['I'].id)
            }
        ).then(

            (childrens) => {

                expect(childrens).to.be.an.array();
                expect(childrens.length).to.equal(0);

            }
        )

    });

    lab.test('grandchildrens', () => {

        //F and G are the grandchildrens of A. grandchildrens of K are G, I, M and N
        return internals.dao.getRelation('grandchildrens', internals.persons['A'].id).then(

            (grandchildrens) => {

                expect(grandchildrens).to.be.an.array();
                expect(grandchildrens.length).to.equal(2);
                expect([grandchildrens[0].id,grandchildrens[1].id]).to.once.include([internals.persons['F'].id,internals.persons['G'].id]);

                return internals.dao.getRelation('grandchildrens', internals.persons['K'].id);
            }
        ).then(

            (grandchildrens) => {

                expect(grandchildrens).to.be.an.array();
                expect(grandchildrens.length).to.equal(4);
                expect(grandchildrens.map((gc) => {return gc.id})).to.once
                    .include([internals.persons['G'].id,internals.persons['I'].id,internals.persons['M'].id,internals.persons['N'].id]);

            }
        );
    });

    lab.test('spouses', () => {

        //the unique spouse of D is B and the one of B is D
        return internals.dao.getRelation('spouses', internals.persons['D'].id).then(

            (spouses) => {

                expect(spouses).to.be.an.array();
                expect(spouses.length).to.equal(1);
                expect(spouses[0].id).to.equal(internals.persons['B'].id);

                return internals.dao.getRelation('spouses', internals.persons['B'].id);
            }
        ).then(

            (spouses) => {

                expect(spouses).to.be.an.array();
                expect(spouses.length).to.equal(1);
                expect(spouses[0].id).to.equal(internals.persons['D'].id);
            }
        );
    });

    lab.test('siblings', () => {

        //The unique sebling of H is F. A has no sibling
        return internals.dao.getRelation('siblings', internals.persons['A'].id).then(

            (siblings) => {

                expect(siblings).to.be.an.array();
                expect(siblings.length).to.equal(0);

                return internals.dao.getRelation('siblings', internals.persons['F'].id);
            }
        ).then(

            (siblings) => {

                expect(siblings).to.be.an.array();
                expect(siblings.length).to.equal(1);
                expect(siblings[0].id).to.equal(internals.persons['H'].id);
            }
        );
    });

    lab.test('uncles', () => {

        //the uncles of G are B and L. The uncle of M is E. and L has no uncle
        return internals.dao.getRelation('uncles', internals.persons['G'].id).then(

            (uncles) => {

                expect(uncles).to.be.an.array();
                expect(uncles.length).to.equal(2);
                expect([uncles[0].id,uncles[1].id]).to.once.include([internals.persons['B'].id,internals.persons['L'].id]);

                return internals.dao.getRelation('uncles', internals.persons['M'].id);
            }
        ).then(

            (uncles) => {

                expect(uncles).to.be.an.array();
                expect(uncles.length).to.equal(1);
                expect(uncles[0].id).to.equal(internals.persons['E'].id);

                return internals.dao.getRelation('uncles', internals.persons['L'].id);
            }
        ).then(

            (uncles) => {

                expect(uncles).to.be.an.array();
                expect(uncles.length).to.equal(0);
            }
        );
    });

    lab.test('aunts', () => {

        //C is the unique anut of F and M has no aunt
        return internals.dao.getRelation('aunts', internals.persons['F'].id).then(

            (aunts) => {

                expect(aunts).to.be.an.array();
                expect(aunts.length).to.equal(1);
                expect(aunts[0].id).to.equal(internals.persons['C'].id);

                return internals.dao.getRelation('aunts', internals.persons['M'].id);
            }
        ).then(

            (aunts) => {

                expect(aunts).to.be.an.array();
                expect(aunts.length).to.equal(0);
            }
        );
    });

    lab.test('cousins', () => {

        //the cousins of G are F, M and N. Cousins of N are G and I. H has no cousins
        return internals.dao.getRelation('cousins', internals.persons['G'].id).then(

            (cousins) => {

                expect(cousins).to.be.an.array();
                expect(cousins.length).to.equal(3);
                expect(cousins.map((c) => {return c.id}))
                    .to.once.include([internals.persons['F'].id,internals.persons['M'].id,internals.persons['N'].id]);

                return internals.dao.getRelation('cousins', internals.persons['N'].id);
            }
        ).then(

            (cousins) => {

                expect(cousins).to.be.an.array();
                expect(cousins.length).to.equal(2);
                expect(cousins.map((c) => {return c.id}))
                    .to.once.include([internals.persons['G'].id,internals.persons['I'].id]);

                return internals.dao.getRelation('cousins', internals.persons['H'].id);
            }
        ).then(

            (cousins) => {

                expect(cousins).to.be.an.array();
                expect(cousins.length).to.equal(0);
            }
        );

    });

    lab.test('nephews', () => {

        //the nephews of C are M and H. G is the nephew of L and D
        return internals.dao.getRelation('nephews', internals.persons['C'].id).then(

            (nephews) => {

                expect(nephews).to.be.an.array();
                expect(nephews.length).to.equal(2);
                expect(nephews.map((c) => {return c.id}))
                    .to.once.include([internals.persons['M'].id,internals.persons['H'].id]);

                return internals.dao.getRelation('nephews', internals.persons['L'].id);
            }
        ).then(

            (nephews) => {

                expect(nephews).to.be.an.array();
                expect(nephews.length).to.equal(1);
                expect(nephews[0].id).to.equal(internals.persons['G'].id);

                return internals.dao.getRelation('nephews', internals.persons['D'].id);
            }
        ).then(

            (nephews) => {

                expect(nephews).to.be.an.array();
                expect(nephews.length).to.equal(1);
                expect(nephews[0].id).to.equal(internals.persons['G'].id);
            }
        )
    });

    lab.test('nephews', () => {

        //the nephews of C are M and H. G is the nephew of L and D
        return internals.dao.getRelation('nephews', internals.persons['C'].id).then(

            (nephews) => {

                expect(nephews).to.be.an.array();
                expect(nephews.length).to.equal(2);
                expect(nephews.map((c) => {return c.id}))
                    .to.once.include([internals.persons['M'].id,internals.persons['H'].id]);

                return internals.dao.getRelation('nephews', internals.persons['L'].id);
            }
        ).then(

            (nephews) => {

                expect(nephews).to.be.an.array();
                expect(nephews.length).to.equal(1);
                expect(nephews[0].id).to.equal(internals.persons['G'].id);

                return internals.dao.getRelation('nephews', internals.persons['D'].id);
            }
        ).then(

            (nephews) => {

                expect(nephews).to.be.an.array();
                expect(nephews.length).to.equal(1);
                expect(nephews[0].id).to.equal(internals.persons['G'].id);
            }
        )
    });
    
    lab.test('nieces', () => {
        
        //F and N are the nieces of C
        return internals.dao.getRelation('nieces', internals.persons['C'].id).then(
            
            (nieces) => {

                expect(nieces).to.be.an.array();
                expect(nieces.length).to.equal(2);
                expect(nieces.map((c) => {return c.id}))
                    .to.once.include([internals.persons['F'].id,internals.persons['N'].id]);

            }
        );
    });

    lab.test('brothersInLaw', () => {

        //B and E are borther-in-law
        return internals.dao.getRelation('brothersInLaw', internals.persons['B'].id).then(

            (brothersInLaw) => {

                expect(brothersInLaw).to.be.an.array();
                expect(brothersInLaw.length).to.equal(1);
                expect(brothersInLaw[0].id).to.equal(internals.persons['E'].id);

                return internals.dao.getRelation('brothersInLaw', internals.persons['E'].id);
            }
        ).then(

            (brothersInLaw) => {

                expect(brothersInLaw).to.be.an.array();
                expect(brothersInLaw.length).to.equal(1);
                expect(brothersInLaw[0].id).to.equal(internals.persons['B'].id);
            }
        );

    });

    lab.test('sistersInLaw', () => {

        //C and D are sister-in-law
        return internals.dao.getRelation('sistersInLaw', internals.persons['C'].id).then(

            (sistersInLaw) => {

                expect(sistersInLaw).to.be.an.array();
                expect(sistersInLaw.length).to.equal(1);
                expect(sistersInLaw[0].id).to.equal(internals.persons['D'].id);

                return internals.dao.getRelation('sistersInLaw', internals.persons['D'].id);
            }
        ).then(

            (sistersInLaw) => {

                expect(sistersInLaw).to.be.an.array();
                expect(sistersInLaw.length).to.equal(1);
                expect(sistersInLaw[0].id).to.equal(internals.persons['C'].id);
            }
        );

    });

    lab.test('siblingsInLaw', () => {

        //D and L are siblings-in-Law of C
        return internals.dao.getRelation('siblingsInLaw', internals.persons['C'].id).then(

            (siblingsInLaw) => {

                expect(siblingsInLaw).to.be.an.array();
                expect(siblingsInLaw.length).to.equal(2);
                expect(siblingsInLaw.map((c) => {return c.id}))
                    .to.once.include([internals.persons['D'].id,internals.persons['L'].id]);
            }
        );

    });

    lab.test('daughtersInLaw', () => {

        //D is the daughter-in-law of A
        return internals.dao.getRelation('daughtersInLaw', internals.persons['A'].id).then(

            (daughtersInLaw) => {

                expect(daughtersInLaw).to.be.an.array();
                expect(daughtersInLaw.length).to.equal(1);
                expect(daughtersInLaw[0].id).to.equal(internals.persons['D'].id);
            }
        );

    });

    lab.test('sonsInLaw', () => {

        //E is the son-in-law of A
        return internals.dao.getRelation('sonsInLaw', internals.persons['A'].id).then(

            (sonsInLaw) => {

                expect(sonsInLaw).to.be.an.array();
                expect(sonsInLaw.length).to.equal(1);
                expect(sonsInLaw[0].id).to.equal(internals.persons['E'].id);
            }
        );

    });

    lab.test('fathersInLaw', () => {

        //A is the father-In-Law of D
        return internals.dao.getRelation('fathersInLaw', internals.persons['D'].id).then(

            (fathersInLaw) => {

                expect(fathersInLaw).to.be.an.array();
                expect(fathersInLaw.length).to.equal(1);
                expect(fathersInLaw[0].id).to.equal(internals.persons['A'].id);
            }
        );

    });

    lab.test('mothersInLaw', () => {

        //K is the father-In-Law of C
        return internals.dao.getRelation('mothersInLaw', internals.persons['C'].id).then(

            (mothersInLaw) => {

                expect(mothersInLaw).to.be.an.array();
                expect(mothersInLaw.length).to.equal(1);
                expect(mothersInLaw[0].id).to.equal(internals.persons['K'].id);
            }
        );

    });




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

