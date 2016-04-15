'use strict';

const Q = require('q');
const Joi = require('joi');
const Validator = require('../../api/validator/index');


/**
 * reads the first 25 persons and result result as JSON (prommise)
 * @param conn: connection to Neo4j (Seraph object)
 * @returns {*|promise}
 */
exports.readSamplePersons = (conn) => {

    const deferred = Q.defer();

    conn.query('MATCH (n:USER) RETURN n LIMIT 25', (err, result) => {

        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(result);
    });

    return deferred.promise;
};

/**
 * Creates and save new person
 * @param conn: connection to Neo4j (Seraph object)
 * @param person: the bject to be validated and saved to the database
 * @returns {*|promise}
 */
exports.savePerson = (conn, person) => {

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
exports.findPerson = (conn, personId) => {

    const deferred = Q.defer();

    conn.find(personId, (err,_person) => {

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
exports.deletePerson = (conn, personId) => {

    const deferred = Q.defer();


    conn.delete(personId, true, (err) => {

        if (err) {
            //connot delete the person
            deferred.reject(err);
        }

        deferred.resolve(true);
    });

    return deferred.promise;
};