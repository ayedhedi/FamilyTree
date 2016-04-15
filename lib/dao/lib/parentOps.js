'use strict';

const Q = require('q');
const PersonOps = require('./personOps');

const internals = {};


/**
 * Set the configuration plugin to be used by the oprations to get access to some configuration parameters if needed
 * @param plugin
 */
exports.setConfigPlugin = (plugin) => {
    internals.config = plugin ;
};

/**
 * Cread a new relation of typer parent between two existing persons. Person with id equals to @param parentId will be
 * the parent of the persont with id equals to @param personId.
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
            const err = internals.canBeParent(locals.person, locals.parent);

            if (err != 0) {
                deferred.reject(new Error(err));
            }

            //no problem -----> proceeds to the creation
            conn.relate(locals.person.id, "child_of", locals.parent.id, (err, relationship) => {
                if (err) {
                    deferred.reject(new Error(-3));
                }

                deferred.resolve(relationship.id);
            })
        },
        () => {
            deferred.reject(new Error(-2))
        }
    );

    return deferred.promise;
};

/**
 *
 * @param conn
 * @param personId
 */
exports.find = (conn, personId) => {
    //TODO: not yet imlemented
    return [];
};

/**
 * Checks if a given person could be the parent of a second person
 * TODO: crrently in this version this checks will be simple; no rule will be used
 * @param person
 * @param parent
 * @returns int: error code (0 -> no problem)
 */
internals.canBeParent = (person, parent) => {
    //parent and person should be defined
    if (!parent || !person) {
        return -10;
    }

    //person should be different to parent
    if (parent.id == person.id ){
        return -11;
    }

    //TODO: add rules

    //no problem 'parent' could be the parent of 'person'
    return 0;
};





