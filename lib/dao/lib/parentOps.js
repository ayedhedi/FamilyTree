'use strict';

const Q = require('q');
const PersonOps = require('./personOps');
const Queries = require('./queries.json');

const internals = {};


/**
 * Set the configuration plugin to be used by the oprations to get access to some configuration parameters if needed
 * @param plugin
 */
exports.setConfigPlugin = (plugin) => {
    internals.config = plugin ;
};

/**
 * Cread a new relation of type parent between two existing persons. Person with id equals to @param parentId will be
 * the parent of the person with id equals to @param personId.
 * TODO: This verion is not yet supporting rules to validate the creation a parent relationship.
 * @param conn: a Seraph object
 * @param personId: id of the person
 * @param parentId: id of the parent
 * @returns {*|promise}
 *      --> reject message: -1  person id does not found
 *                          -2  parent id does not found
 *                          -3 database error !!
 *                          -XX refused by the rules
 */
exports.create = (conn, personId, parentId) => {


    const deferred = Q.defer();

    const locals = {};

    //cehcks if person exist
    PersonOps.findById(conn, personId).then(
        (person) => {

            locals.person = person;
            return PersonOps.findById(conn, parentId);
        } ,
        () => {
            deferred.reject(new Error(-1))
        }
    ).then(
        (parent) => {

            locals.parent = parent;
            //parent and person were found, start checking
            return internals.canBeParent(conn, locals.person, locals.parent);
        },
        () => {
            deferred.reject(new Error(-2))
        }
    ).then (

        () => {

            conn.relate(locals.person.id, "child_of", locals.parent.id, (err, relationship) => {

                if (err) {
                    deferred.reject(new Error(-3));
                }

                deferred.resolve(relationship.id);
            })
        },
        (err) => {
            deferred.reject(err);
        }
    ).done();

    return deferred.promise;
};

/**
 * Find parents of a given person
 * @param conn
 * @param personId
 * @returns {*|promise}
 *          promise resolved --> a list of parents is returned (could be empty)
 *          promise rejected -->  : database problem !!
 */
exports.find = (conn, personId) => {
    return Q.nfcall(conn.query, Queries.personParents, {id: personId});
};



/**
 * Checks if a given person could be the parent of a second person
 * TODO: crrently in this version this checks will be simple; no rule will be used
 * @param conn: the connection
 * @param person: the object person
 * @param parent: the object parent
 * @returns {*|promise}
 *          promise resolved --> person and parent respect rules
 *          promise rejected -->  -3 : database problem !!
 *                               -10 : person or parent is undifined
 *                               -11 : parent is equals to person
 *                               -12 : max parents rule not respected
 */
internals.canBeParent = (conn, person, parent) => {
    const deferred = Q.defer();

    //parent and person should be defined
    if (!parent || !person) {
        deferred.reject(new Error(-10));
        return deferred.promise;
    }

    //person should be different to parent
    if (parent.id == person.id ){
        deferred.reject(new Error(-11));
        return deferred.promise;
    }

    //TODO: add rules
    const maxParents = internals.config.get('maxParents', 'rules');
    exports.find(conn, person.id).then(

        (parents) => {

            if (maxParents!=0 && parents.length >= maxParents) {
                deferred.reject(new Error(-12));
            }

            deferred.resolve();
        },
        () => {
            deferred.reject(new Error(-3));
        }
    ).done();


    return deferred.promise;
};




