'use strict';

//load modules
const Dream = require('dreamjs');
const Moment = require('moment');
const RandExp = require('randexp');
const Configs = require('../lib/config/lib/validator.json');
const Countries = require('./resources/countries.json');

//internals
const internals = {};

Dream.customType('gender',  (helper) => {

    const g = ['M', 'F'];
    return helper.oneOf(g);
});

Dream.customType('birthDate', (helper) => {

    const d = [internals.birthDateFix(), internals.birthDatePlage(), internals.birthDateRelative(helper)];
    return helper.oneOf(d);
});

Dream.customType('place', (helper) => {

   let p = [{
       country: helper.oneOf(Countries).name,
       city: new RandExp(/^(.){2,10}$/).gen(),
       latitude: ((Math.random() * 180) - 90),
       longitude: ((Math.random() * 360) - 180)
   }, undefined];

    return helper.oneOf(p);
});



exports.validPerson = () => {


    return Dream
        .schema({
            firstName: /^(.){2,16}$/,
            lastName: /^(.){2,16}$/,
            gender: 'gender',
            dateOfBirth: 'birthDate',
            placeOfBirth: 'place'
        })
        .generateRnd()
        .output();
};



internals.birthDateFix = () => {
    let min = Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).millisecond();;
    let max = Moment().millisecond();
    let ret = Math.floor((Math.random() * (max -min)) + min);

    return {
        date: Moment().millisecond(ret).format(Configs.personBirthDateFormat)
    };
};

internals.birthDatePlage = () => {
    let min = Moment(Configs.personBirthDateMin, Configs.personBirthDateFormat).year();
    let max = Moment().year() - 1;
    let fromYear = Math.floor(Math.random() * (max - min)) + min - 1 ;
    let toYear = Math.floor(Math.random() * (max + 1 - fromYear)) + fromYear + 1;
    return {
        fromYear: fromYear,
        toYear: toYear
    }
};

internals.birthDateRelative = (helper) => {
    let max = Moment().year() - 1;
    let year = Math.floor(Math.random() * max);
    const g = ['A', 'B'];
    return {
        type: helper.oneOf(g),
        year: year
    }
};