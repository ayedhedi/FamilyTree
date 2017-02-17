'use strict';

const Q = require('q');
const Joi = require('joi');
const _ = require('underscore');
const Async = require('async');
const Validator = require('../../api/validator/index');

const internals = {
    queries: {
        personDataRelation: "start p=node({id}) match (p)-[r]->(n) where type(r) IN ['born_in', 'born_on', 'dead_on'] return n",
        getPersonFirtName: "MATCH (n:Person {firstName:'%1'}) RETURN n"
    }
};


/**
 * Update an existing person object using fields of new person object. Any field found in the new obejct that does not
 * mush to a field in the Person class, will be ignored
 * @param conn
 * @param oldPerson
 * @param newPerson
 * //TODO: finish this function !!
 */
exports.update = (conn, oldPerson, newPerson) => {

    const deferred = Q.defer();

    //first check to do ==>  the person id should be given and person data are correct
    const personId = oldPerson.id;

    //person id should be present, otherwise reject and return
    if (!personId) {
        deferred.reject(new Error("Invalid data: Person id should be present !!"))
        return deferred.promise;
    }

    //read data from DB
    conn.read(personId, (err,_person) => {

        if (err) {
            //cannot read the person with id
            deferred.reject(err);
        }

        deferred.resolve(_person);
    });


    var changed = false;

    if (newPerson.firstName && newPerson.firstName != oldPerson.firstName ) {
        oldPerson.firstName = newPerson.firstName;
        changed = true;
    }
    if (newPerson.lastName && newPerson.lastName != oldPerson.lastName) {
        oldPerson.lastName = newPerson.lastName;
        changed = true;
    }
    if (newPerson.gender && newPerson.gender != oldPerson.gender) {
        oldPerson.gender = newPerson.gender;
        changed = true;
    }

    //this table will contain validation functions to be executed in async way
    let funcArray = [];
    //if the dateOfBirth is given, it hsould be valid
    if (newPerson.dateOfBirth) {
        funcArray.push(
            internals.validateAndSet(oldPerson.dateOfBirth, newPerson.dateOfBirth, Validator.dateSchema, callback)
        );
    }
    //if dateOfDeath is given it should be valid
    if (newPerson.dateOfDeath) {
        funcArray.push(
            internals.validateAndSet(oldPerson.dateOfDeath, newPerson.dateOfDeath, Validator.dateSchema, callback)
        )
    }

    //if placeOfBirth is given it should be valid
    if (newPerson.placeOfBirth) {
        funcArray.push(
            internals.validateAndSet(oldPerson.placeOfBirth, newPerson.placeOfBirth, Validator.placeSchema, callback)
        )
    }

    //update all new data objects
    Async.series(funcArray,
        (err, results) => {
            if (err) {

                //one object is not valid
                deferred.reject(err);
            }
            //check if any data has been modified !!
            results.map( _changed => {
                changed = changed || _changed;
            })
        }
    );

    if (!changed) {
        //nothing to update
        deferred.resolve(false);
    }else {
        //at least one modification was made ===> try to update

    }

    return deferred.promise;
};

/**
 * Creates and save new person
 * @param conn: connection to Neo4j (Seraph object)
 * @param person: the bject to be validated and saved to the database
 * @returns {*|promise}
 * //FIXME: should stop if any error
 */
exports.save = (conn, person) => {

    const deferred = Q.defer();

    Joi.validate(person, Validator.personSchema, (err) => {

        //if not valid stop process and return a rejected promise
        if (err) {
            deferred.reject(err);
        }else {
            return internals.saveValidPerson(conn, person);
        }

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
 * find
 * @param conn: connection to db
 * @param firstName: the firstname to lokking for
 * @param limit: the maximum size
 */
exports.findByFirstName = (conn, firstName, limit) => {

    const deferred = Q.defer();

    let query = internals.queries.getPersonFirtName.replace('%1', firstName);
    if (limit) {
        query = query + " LIMIT " + limit;
    }
    conn.query(
        query,
        {},
        (err, persons) => {

            if (err) {
                deferred.reject(err);
            }else {
                deferred.resolve(persons);
            }
        }
    );

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
 * save a person that should be validated before
 * @param conn
 * @param person
 * @returns {*|promise}
 */
internals.saveValidPerson = (conn, person) => {

    const deferred = Q.defer();

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

        } else {
            //that's it ;) return the person
            deferred.resolve(results[_person]);
        }
    });

    return deferred.promise;
};

/**
 * Returns born_in, born_on and dead_on nodes of a given person
 * @param conn
 * @param id
 * @returns {*|promise}
 */
internals.findPersonRelatedNodes = (conn, id) => {

    const deferred = Q.defer();

    conn.query(internals.queries.personDataRelation, {id: id}, (err, nodes) => {

        //problem found reject the promise
        if (err){
            deferred.reject(err);
        }

        deferred.resolve(nodes);
    });

    return deferred.promise;
};

/**
 * This will validate a new object according to Joi schema and if the object is valid it will be compared
 * with an old value. This function will use the deep "isEqual" function of underscore lib to copare values.
 * The function will also set the value of the new object.
 * @param oldObj the old value of the object
 * @param newObj the new value which will be validated before the comparaison
 * @param schema the Joi schema
 * @param callback(err, result) :
 *          err -> null if the object is valid
 *          result ->  true if the old and the new objects are equals, false otherwise
 */
internals.validateAndSet = (oldObj, newObj, schema, callback) => {

    Joi.validate(newObj, schema, (err) => {

        if (err) {
            return callback(err, null);
        }

        if (!_.isEqual(oldObj, newObj)) {

            oldObj = newObj;
            return callback(null, true);
        }

        return callback(null, false);
    })
};