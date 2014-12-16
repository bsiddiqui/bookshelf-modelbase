'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('test_table', function (table) {
    table.increments('id');
    table.string('name');
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('test_table'); 
};
