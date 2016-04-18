'use strict';

const cfgManager = require('node-config-manager');


const internals = {
    options : {
        configDir: './lib/config/lib',
        camelCase: true
    }
};


exports.register = (server, options, next) => {

    cfgManager.init(internals.options);
    cfgManager.addConfig('db');
    cfgManager.addConfig('validator');
    cfgManager.addConfig('rules');

    server.expose('get', (key, category) => {
        return cfgManager.getConfig(category)[key];
    });

    return next();
};


exports.register.attributes = {
    pkg: require('./package.json')
};
