var knexFile = require('./knexfile');
var knex     = require('knex')(knexFile['development']);

module.exports = knex;
