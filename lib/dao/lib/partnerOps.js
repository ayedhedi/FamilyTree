'use strict';

const Q = require('q');
const PersonOps = require('./personOps');
const RelationOps = require('./relationOps');

const internals = {
    personPartnersQuery: "start p=node({id}) match (p)-[r]->(n) where type(r) IN ['partner_of'] return n"
};


/**
 * Set the configuration plugin to be used by the oprations to get access to some configuration parameters if needed
 * @param plugin
 */
exports.setConfigPlugin = (plugin) => {
    internals.config = plugin ;
};

/**
 * Cread a new relation of type partner between two existing persons. Person with id equals to partnerId will be
 * the set as a partner of the person with id equals to @param personId.
 * TODO: cannot find a away to create a bidirectional
 * This function will also create the relation of the other sens (pertner --> person)
 * TODO: This verion is not yet supporting rules to validate the creation a parent relationship.
 * @param conn: a Seraph object
 * @param personId: id of the person
 * @param partnerId: id of the parent
 * @returns {*|promise}
 *      --> reject message: -1  person id does not found
 *                          -2  parent id does not found
 *                          -3 database error !!
 *                          -XX refused by the rules
 */
exports.create = (conn, personId, partnerId) => {


    const deferred = Q.defer();

    const locals = {};

    //cehcks if person exist
    PersonOps.findById(conn, personId).then(
        (person) => {

            locals.person = person;
            return PersonOps.findById(conn, partnerId);
        } ,
        () => {
            deferred.reject(new Error(-1))
        }
    ).then(
        (partner) => {

            locals.partner = partner;
            //partner and person were found, start checking
            return internals.canBePartner(conn, locals.person, locals.partner);
        },
        () => {
            deferred.reject(new Error(-2))
        }
    ).then (

        () => {

            // person ---> partner
            conn.relate(locals.person.id, "partner_of", locals.partner.id, (err) => {

                if (err) {
                    deferred.reject(new Error(-3));
                }

                // pertner --> person
                conn.relate(locals.partner.id, "partner_of", locals.person.id, (err, relationship) => {

                    if (err) {
                        deferred.reject(new Error(-3));
                    }

                    deferred.resolve(relationship.id);
                })
            })
        },
        (err) => {
            deferred.reject(err);
        }
    ).done();

    return deferred.promise;
};


/**
 * Find partners of a given person
 * @param conn
 * @param personId
 * @returns {*|promise}
 *          promise resolved --> a list of parents is returned (could be empty)
 *          promise rejected -->  : database problem !!
 */
exports.find = (conn, personId) => {
    return Q.nfcall(conn.query, internals.personPartnersQuery, {id: personId});
};



/**
 * Checks if a given person could be the partner of a second one
 * TODO: crrently in this version this checks will be simple; no rule will be used
 * @param conn: the connection
 * @param person: the object person
 * @param partner: the object partner
 * @returns {*|promise}
 *          promise resolved --> person and partner respect rules
 *          promise rejected -->  -3 : database problem !!
 *                               -10 : person or partner is undifined
 *                               -11 : partner is equals to person
 *                               -12 : max partners rule not respected
 */
internals.canBePartner = (conn, person, partner) => {
    const deferred = Q.defer();

    //partner and person should be defined
    if (!partner || !person) {
        deferred.reject(new Error(-10));
        return deferred.promise;
    }

    //person should be different form his/her partner
    if (partner.id == person.id ){
        deferred.reject(new Error(-11));
        return deferred.promise;
    }

    const maxPartners = internals.config.get('maxPartners', 'rules');
    exports.find(conn, person.id).then(

        (partners) => {
            if (maxPartners != 0 && partners.length >= maxPartners) {
                console.log(partner+" cannot be partner of "+person);
                deferred.reject(new Error(-12));
            }

            //check the forbedden partner rules
            return internals.checkForbeddenPartnerRules(conn, person, partner);
        },
        () => {
            deferred.reject(new Error(-3));
        }
    ).then(
        () => {
            deferred.resolve();
        },
        () => {
            deferred.reject(new Error(-13));
        }
    ).done();



    return deferred.promise;
};


/**
 * Checks if the given person and future partner respect the rule of the forbidden partner or not.
 * @param conn Connection to the Neo4j database
 * @param person The person to controle
 * @param partner The partner of the person
 * @returns {*|promise}
 *          promise resolved --> the rule is respected
 *          promise rejected --> the rule is not respected
 */
internals.checkForbeddenPartnerRules = (conn, person, partner) =>  {

    const deferred = Q.defer();
    const forbeddenPartners = internals.config.get('forbeddenPartner', 'rules');
    const promises = [];

    forbeddenPartners.map(rel => {
        promises.push(internals.checksPartnerRelation(conn, person.id, rel, partner.id));
    });


    //execute all the promises and wait the end
    Promise.all(promises).then(
        () => {
            deferred.resolve();
        },
        () => {
            deferred.reject();
        }
    );

    //deferred.resolve();
    return deferred.promise;
};

/**
 * checks if a given relation exists beween two persons or not
 * @param conn
 * @param personOneId
 * @param relation
 * @param personTwoId
 * @returns {*|promise}
 *          --> if resolved: the relation does not exist between person and parent
 *          --
 */
internals.checksPartnerRelation = (conn, personOneId, relation, personTwoId) => {
    const deferred = Q.defer();

    RelationOps.get(conn, relation, personOneId).then(
        (persons) => {
            persons.map(per => {
                if (per.id == personTwoId) {
                    deferred.reject();
                }
            });
            deferred.resolve();
        },
        (err) => {
            console.log("err: "+err);
            deferred.reject(err);
        }
    );

    return deferred.promise;
};










