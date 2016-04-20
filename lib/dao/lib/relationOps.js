'use strict';

const Q = require('q');

const internals = {
    // the parent of someone's parent
    grandParents: "start n=node({id}) match (n)-[:child_of*2..2]->(gp) return gp",
    //One's son or daughter, regardless of age.
    childrens: "start n=node({id}) match (n)<-[:child_of]-(c) return c",
    //A child of someone's child
    grandchildrens: "start n=node({id}) match (n)<-[:child_of]-()<-[:child_of]-(gc) return gc",
    //A person's husband or wife (a pertner)
    spouses: "start n=node({id}) match (n)-[:partner_of]->(s:Person) return s",
    //A person who shares same parents. One's brother or sister.
    siblings: "start n=node({id}) match (n)-[:child_of]->()<-[:child_of]-(b) return b",
    //The brother or brother-in-law of one’s parent.
    uncles: "start n=node({id}) match (n)-[child_of]->()-[:partner_of]-(x)-[:child_of]->()<-[:child_of]-(p {gender:'M'}) " +
    "where not (n)-[:child_of]->(x) return p UNION start n=node({id}) match (n)-[:child_of*2..2]->()<-[:child_of]-(p {gender:'M'}) return p",
    //The sister or sister-in-law of one’s parent.
    aunts: "start n=node({id}) match (n)-[child_of]->()-[:partner_of]-(x)-[:child_of]->()<-[:child_of]-(p {gender:'F'}) " +
    "where not (n)-[:child_of]->(x) return p UNION start n=node({id}) match (n)-[:child_of*2..2]->()<-[:child_of]-(p {gender:'F'}) return p",
    //The son or daughter of a person’s uncle or aunt; a first cousin.
    cousins: "start n=node({id}) match (n)-[:child_of]->(a)-[:child_of]->()<-[:child_of]-(b)<-[:child_of]-(c) where not(ID(a)=ID(b)) return c",
    //A son of one's sibling, brother-in-law, or sister-in-law
    nephews: "start n=node({id}) match (n)-[:child_of]->()<-[:child_of*2..2]-(p:Person {gender: 'M'}) return p " +
    "UNION start n=node({id}) match (n)-[:child_of]->()<-[:child_of]-(s)-[:partner_of]->(sl)<-[:child_of]-(p {gender: 'M'}) where not (ID(n)=ID(s)) and not (n)-[]-(sl) return p "+
    "UNION start n=node({id}) match (n)-[:partner_of]-()-[:child_of]->()<-[:child_of*2..2]-(p:Person {gender: 'M'}) return p",
    //A daughter one's sibling, brother-in-law, or sister-in-law
    nieces: "start n=node({id}) match (n)-[:child_of]->()<-[:child_of*2..2]-(p:Person {gender: 'F'}) return p " +
    "UNION start n=node({id}) match (n)-[:child_of]->()<-[:child_of]-(s)-[:partner_of]->(sl)<-[:child_of]-(p {gender: 'F'}) where not (ID(n)=ID(s)) and not (n)-[]-(sl) return p "+
    "UNION start n=node({id}) match (n)-[:partner_of]-()-[:child_of]->()<-[:child_of*2..2]-(p:Person {gender: 'F'}) return p",
    //The brother of one's spouse. OR The husband of one's sibling.
    brothersInLaw: "start n=node({id}) match (n)-[:child_of]->()<-[:child_of]-()-[:partner_of]-(p {gender:'M'}) return p " +
    "UNION start n=node({id}) match (n)-[:partner_of]-()-[:child_of]->()<-[child_of]-(p {gender:'M'}) return p",
    //The sister of one's spouse OR The wife of one's sibling.
    sistersInLaw: "start n=node({id}) match (n)-[:child_of]->()<-[:child_of]-()-[:partner_of]-(p {gender:'F'}) return p " +
    "UNION start n=node({id}) match (n)-[:partner_of]-()-[:child_of]->()<-[child_of]-(p {gender:'F'}) return p",
    //brother-in-law OR sister-in-law
    siblingsInLaw: "start n=node({id}) match (n)-[:child_of]->()<-[:child_of]-()-[:partner_of]-(p) return p " +
    "UNION start n=node({id}) match (n)-[:partner_of]-()-[:child_of]->()<-[child_of]-(p) return p",
    //The wife of one's child
    daughtersInLaw: "start n=node({id}) match (n)<-[:child_of]-()<-[:partner_of]-(p {gender:'F'}) return p",
    //The husband of one's child
    sonsInLaw: "start n=node({id}) match (n)<-[:child_of]-()<-[:partner_of]-(g {gender:'M'}) return g",
    //One's spouse's father.
    fathersInLaw: "start n=node({id}) match (n)-[:partner_of]->()-[:child_of]->(p {gender:'M'}) return p",
    //One’s spouse’s mother.
    mothersInLaw: "start n=node({id}) match (n)-[:partner_of]->()-[:child_of]->(p {gender:'F'}) return p"
};


exports.get = (conn, relation, personId) => {

    const deferred = Q.defer();
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

