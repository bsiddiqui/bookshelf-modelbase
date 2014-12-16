var knexFile = require(__dirname + '/knexfile');
var knex     = require('knex')(knexFile['development']);

module.exports = knex;
