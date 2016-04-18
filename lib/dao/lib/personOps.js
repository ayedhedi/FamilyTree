'use strict';

const Q = require('q');
const Joi = require('joi');
const Validator = require('../../api/validator/index');
const Queries = require('./queries.json');

const internals = {};

/**
 * Creates and save new person
 * @param conn: connection to Neo4j (Seraph object)
 * @param person: the bject to be validated and saved to the database
 * @returns {*|promise}
 */
exports.save = (conn, person) => {

    const deferred = Q.defer();

    Joi.validate(person, Validator.personSchema, (err) => {

        if (err) {
            console.log("Person is not valid: "+err);
            console.log(person);
            deferred.reject(err);
        }

        //create transaction
        const txn = conn.batch();


        var dateOfBirth, dateOfDeath, placeOfBirth;
        //save dateOf Birth if exists
        if (person.dateOfBirth) {

            dateOfBirth = txn.save(person.dateOfBirth);
            person.dateOfBirth = undefined;
        }

        //save dateOfDeath if exists
        if (person.dateOfDeath) {

            dateOfDeath = txn.save(person.dateOfDeath);
            person.dateOfDeath = undefined;
        }

        //save place of birth if exists
        if (person.placeOfBirth){

            placeOfBirth = txn.save(person.placeOfBirth);
            person.placeOfBirth = undefined;
        }

        //save the person nown
        const _person = txn.save(person);
        txn.label(_person, 'Person');

        //creation relations if any
        if (dateOfBirth) {
            txn.relate(_person,"born_on",dateOfBirth);
            txn.label(dateOfBirth,"Date");
        }
        if (dateOfDeath) {
            txn.relate(_person,"dead_on ",dateOfDeath);
            txn.label(dateOfDeath,"Date");
        }
        if (placeOfBirth) {
            txn.relate(_person,"born_in",placeOfBirth);
            txn.label(placeOfBirth,"Place");
        }


        //transcation commit now !!
        txn.commit((err, results) => {

            if (err) {
                deferred.reject(err);
            }

            //all is fine ;) return the person
            deferred.resolve(results[_person]);
        });
    });

    return deferred.promise;
};


/**
 * find a person by id
 * @param conn
 * @param personId
 * @returns {*|promise}
 */
exports.findById = (conn, personId) => {

    const deferred = Q.defer();

    conn.read(personId, (err,_person) => {

        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(_person);
    });

    return deferred.promise;
};




/**
 * delte a Person by id
 * @param conn
 * @param personId
 * @returns {*|promise}
 */
exports.remove = (conn, personId) => {

    const deferred = Q.defer();


    internals.findPersonRelatedNodes(conn, personId).then(

        (nodes) => {

            //delete the pereson first and its relation
            conn.delete(personId, true, (err) => {

                if (err) {
                    deferred.reject(err);
                }

                //delete chirdrens now (nodes)
                nodes.map((node) => {

                    conn.delete(node.id, true, (err) => {

                        if (err) {
                            deferred.reject(err);
                        }
                    })
                });

                deferred.resolve();
            });

        },
        (err) => {
            deferred.reject(err);
        }
    ).done();


    return deferred.promise;
};


/**
 * Returns born_in, born_on and dean_in nodes of a given person
 * @param conn
 * @param id
 * @returns {*|promise}
 */
internals.findPersonRelatedNodes = (conn, id) => {

    const deferred = Q.defer();

    conn.query(Queries.personDataRelation, {id: id}, (err, nodes) => {

        //problem found reject the promise
        if (err){
            deferred.reject(err);
        }

        deferred.resolve(nodes);
    });

    return deferred.promise;
};