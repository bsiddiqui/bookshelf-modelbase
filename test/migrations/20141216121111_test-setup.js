'use strict'

exports.up = function (knex, Promise) {
  return knex.schema.createTable('test_table', function (table) {
    table.increments('id')
    table.string('first_name').notNullable()
    table.string('last_name')
    table.timestamps()
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('test_table')
}
