'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Validator = require('../validator/index');

// Declare internals
const internals = {};


exports.register = (server, options, next) => {

    server.dependency('dao', internals.after);
    return next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};


internals.after = (server, next) => {

    /**
     * Read a person by Id
     */
    server.route({
        method: 'GET',
        path: '/persons/{id}',
        config: {
            description: 'Returns a person with id ',
            validate: {
              params: {
                  id: Joi.number().integer().min(0)
              }
            },
            handler: (request, reply) => {

                const id = request.params.id;
                server.plugins.dao.findPerson(id).then(

                    (person) => {
                        return reply(person);
                    },
                    () => {
                        return reply(Boom.badRequest('Cannot find person with id:'+id));
                    }
                );
            }
        }
    });

    /**
     * Create a new Person. Json should represent a valid person.
     */
    server.route({
        method: 'POST',
        path: '/persons/create.json',
        config: {
            description: 'Add new person to the Tree',
            validate: {
                payload: Validator.validatePerson
            },
            handler: (request, reply) => {

                const person = request.payload;
                server.plugins.dao.savePerson(person).then(

                    (person) => {
                        return reply(person);
                    },
                    (err) => {
                        return reply(err);
                    }
                );
            }
        }
    });

    /**
     * Delete a person with id.
     */
    server.route({
        method: 'POST',
        path: '/persons/destroy/{id}',
        config: {
            description: 'Delete one person with id',
            validate: {
                params: {
                    id: Joi.number().integer().min(0)
                }
            },
            handler:  (request, reply) => {

                const id = request.params.id;
                //find peson ?
                server.plugins.dao.findPerson(id).then(

                    (person) => {
                        //now try to delete the person
                        server.plugins.dao.deletePerson(id).then(

                            () => {
                                return reply().code(204);
                            },
                            () => {
                                return reply(Boom.badImplementation('Error when trying to delete person with id: '+id));
                            }
                        )
                    },
                    () => {
                        return reply(Boom.notFound("Cannot found person id="+id));
                    }
                );
            }
        }
    });

    /**
     * Update an existing person. The id of ther person should be given.
     */
    server.route({
        method: 'POST',
        path: '/persons/update.json',
        config:{
            description: 'Updating an existing person',
            validate: {
                payload: Joi.object(),
                params: {
                    id: Joi.number().integer().min(0)
                }
            },
            handler: (request, reply) => {

                const id = request.params.id;
                const newPErson = request.payload;
                server.plugins.dao.findPerson(id).then(

                    (oldPerson) => {

                    },
                    () => {
                        return reply(Boom.notFound("Cannot found person id="+id));
                    }
                );
            }
        }
    });

    return next();
};



