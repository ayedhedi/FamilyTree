'use strict';

const Q = require('q');
const Joi = require('joi');
const Validator = require('../../api/validator/index');

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
/*
    const local = {
        childrens: []
    };*/

    internals.findRelations(conn, personId, 'out', '').then(

        (relations) => {

            /*if (relations && relations.length() > 0) {
              relations.map((rel) => {
                  local.childrens.push(rel.end);
              })
            }*/

            //now let's delete the node
            conn.delete(personId, true, (err) => {

                if (err) {
                    //connot delete the person
                    deferred.reject(err);
                }

                //finally delete orphans nodes if any

                //create transaction
                const txn = conn.batch();

                if (relations && relations.length > 0) {
                    relations.map((rel) => {

                        txn.delete(rel.end);
                    });

                    //commit now
                    txn.commit((err) => {

                        if (err){
                            deferred.reject(err);
                        }
                        deferred.resolve(true);
                    })

                }else {
                    //no orphens node to deletes
                    deferred.resolve(true);
                }
            });

        },
        (err) => {
            deferred.reject(err);
        }
    );



    return deferred.promise;
};


/**
 * get relations by id, direction and type
 * @param conn
 * @param id
 * @param direction
 * @param type
 * @returns {*|promise}
 */
internals.findRelations = (conn, id, direction, type) => {

    const deferred = Q.defer();

    conn.relationships(id, direction, type, (err, relationships) => {

        //problem found reject the promise
        if (err){
            deferred.reject(err);
        }

        //no problem resolve the promise --> retuns either the
        if (relationships.length == 0) {
            deferred.resolve(undefined);
        }else {
            deferred.resolve(relationships[0].end);
        }
    });

    return deferred.promise;
};