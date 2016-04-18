'use strict';

const Q = require('q');

const internals = {
    grandParents: "start n=node({id}) match (n)-[:child_of*2..2]->(gp) return gp"
};


exports.get = (conn, relation, personId) => {

    const deferred = q.defer();
    const query = internals[relation];

    if ( !query ) {

        deferred.reject('Unknown relation: '+relation);
    }else{

        conn.query(query, {id: personId}, (err, result) => {

            if (err) {
                deferred.reject(err);
            }

            deferred.resolve(result);
        })
    }

    return deferred.promise;
};

