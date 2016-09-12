var path = require('path')
var knexFile = require(path.resolve(__dirname, 'knexfile.js'))
var knex = require('knex')(knexFile['development'])

module.exports = knex
