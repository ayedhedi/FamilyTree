'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Async = require('async');
const Moment = require('moment');
const Validator = require('../lib/api/validator/index');
const Generator = require('./dataGenerator');
const Configs = require('../lib/config/lib/validator.json');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;


describe('validate input person ', () => {

    it ('accepts a valid input person', (done) => {

        let person = Generator.validPerson();
        //console.log("Person = "+JSON.stringify(person));

        Validator.validateInputPerson(person, {}, (err) => {

            expect(err).to.not.exist();
        });

        done();
    });

    it ('rejects invalid firstName', (done) => {


        Async.parallel(
            [(end) => {

                let person = Generator.validPerson();
                person.firstName = '';
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"firstName" is not allowed to be empty');

                    end();
                });
            },

            (end) => {

                let person = Generator.validPerson();
                person.firstName = undefined;
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"firstName" is required');

                    end();
                });
            }]
        );

        done();
    });

    it ('rejects invalid lastName', (done) => {


        Async.parallel(
            [(end) => {

                let person = Generator.validPerson();
                person.lastName = '';
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"lastName" is not allowed to be empty');

                    end();
                });
            },

                (end) => {

                    let person = Generator.validPerson();
                    person.lastName = undefined;
                    Validator.validateInputPerson(person, {}, (err) => {

                        expect(err).to.exist();
                        expect(err.details).to.be.array();
                        expect(err.details[0].message).to.be.equal('"lastName" is required');

                        end();
                    });
                }]
        );

        done();
    });


    it('rejects invalid gender', (done) => {

        Async.parallel([
            (end) => {
                let person = Generator.validPerson();
                person.gender = '';
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"gender" must be one of [M, F]');
                });

                end();
            },
            (end) => {
                let person = Generator.validPerson();
                person.gender = 'MALE';
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"gender" must be one of [M, F]');
                });

                end();
            }
        ]);



        done();
    });


    it('rejects invalid dateOfBirth', (done) => {

        Async.parallel([
            (end) => {

                let person = Generator.validPerson();
                person.dateOfBirth = '';
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"dateOfBirth" must be a number of milliseconds or valid date string');
                });

                end();
            },
            (end) => {

                let date = Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).subtract(1, 'seconds').format(Configs.personBirthDateFormat);
                let person = Generator.validPerson();
                person.dateOfBirth = date;
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.contains('"dateOfBirth" must be larger than or equal to');
                });

                end();
            },
            (end) => {

                let date = Moment().add(1, 'd').format(Configs.personBirthDateFormat);
                let person = Generator.validPerson();
                person.dateOfBirth = date;
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.contains('"dateOfBirth" must be less than or equal to');
                });

                end();
            },
            (end) => {

                let date = {
                    fromYear: Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).subtract(1, 'years').year(),
                    toYear: Moment().year()
                };
                let person = Generator.validPerson();
                person.dateOfBirth = date;
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"dateOfBirth" must be a number of milliseconds or valid date string');
                });

                end();
            },
            (end) => {

                let date = {
                    toYear: Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).year(),
                    fromYear: Moment().year()
                };
                let person = Generator.validPerson();
                person.dateOfBirth = date;
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"dateOfBirth" must be a number of milliseconds or valid date string');
                });

                end();
            },
            (end) => {

                let date = {
                    year: Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).year(),
                    type: 'Z'
                };
                let person = Generator.validPerson();
                person.dateOfBirth = date;
                Validator.validateInputPerson(person, {}, (err) => {

                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"dateOfBirth" must be a number of milliseconds or valid date string');
                });

                end();
            }
        ]);
        done();
    });


    it('rejects invalid palce of birth ', (done) => {

        Async.series([

            (end) => {

                let person = Generator.validPerson();
                person.placeOfBirth =  {
                    country: 'Australia',
                    latitude: 1.6870129108428955
                };

                Validator.validateInputPerson(person, {}, (err) => {

                    //console.log(err.details[0].message);
                    expect(err).to.exist();
                    expect(err.details).to.be.array();
                    expect(err.details[0].message).to.be.equal('"latitude" missing required peer "longitude"');
                });

                end();
            }
        ]);

        done();
    })


});