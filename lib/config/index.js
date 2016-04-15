'use strict';

const cfgManager = require('node-config-manager');


const internals = {
    options : {
        configDir: './lib/config/lib',
        camelCase: true
    },
    get : (key, category) => {
       return cfgManager.getConfig(category)[key];
    }
};


exports.register = (server, options, next) => {

    cfgManager.init(internals.options);
    cfgManager.addConfig('db');
    cfgManager.addConfig('validator');

    server.expose('get', internals.get);

    return next();
};


exports.register.attributes = {
    pkg: require('./package.json')
};
