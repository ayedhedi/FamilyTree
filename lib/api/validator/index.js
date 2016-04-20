'use strict';

const Joi = require('joi');
const Moment = require('moment');
const Configs = require('./../../config/lib/validator.json');
const Async = require('async');

// Declare internals
const internals = {
    regexName: /^(.){1,16}$/
};


exports.validateInputPerson = (value, options, next) => {

    Joi.validate(value, exports.personSchema, (err, val) => {

        next(err, val);
    });
};

//date scehma
const dateSchema = exports.dateSchema = Joi.alternatives().try(
    [
        //a fixed date (checks min and max from configs)
        Joi.object().keys({
           date: Joi.date().format(Configs.personBirthDateFormat).min(Configs.personBirthDateMin).max((new Date()).toDateString())
        }),
        //a between object with fromYear and toYear
        Joi.object().keys({
            fromYear: Joi.number().required().min(Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).year() - 1)
                .max( new Date().getFullYear() ).less(Joi.ref('toYear')),
            toYear: Joi.number().required().max(new Date().getFullYear())
        }),
        //or a relative date
        Joi.object().keys({
            //A: After, B: Before
            type: Joi.any().valid('A','B'),
            year: Joi.number().required().max( new Date().getFullYear() )
        })
    ]
);

const placeSchema = exports.placeSchema = Joi.object().keys({

    country: Joi.string(),
    state: Joi.string(),
    city: Joi.string(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
}).optionalKeys('latitude','longitude').with('latitude', 'longitude')
    .with('longitude', 'latitude');


//person's schema
exports.personSchema = Joi.object().keys({

    firstName: Joi.string().required().regex(internals.regexName),
    lastName: Joi.string().required().regex(internals.regexName),
    gender: Joi.any().required().valid('M', 'F'),
    dateOfBirth: dateSchema,
    dateOfDeath: dateSchema,
    placeOfBirth: placeSchema

}).optionalKeys('dateOfBirth','dateOfDeath','placeOfBirth');

