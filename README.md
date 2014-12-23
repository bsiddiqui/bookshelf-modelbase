#bookshelf-modelbase
[![Build Status](https://travis-ci.org/enjoy/bookshelf-modelbase.svg?branch=master)](https://travis-ci.org/enjoy/bookshelf-modelbase) [![Code Climate](https://codeclimate.com/github/enjoy/bookshelf-modelbase/badges/gpa.svg)](https://codeclimate.com/github/enjoy/bookshelf-modelbase) [![Test Coverage](https://codeclimate.com/github/enjoy/bookshelf-modelbase/badges/coverage.svg)](https://codeclimate.com/github/enjoy/bookshelf-modelbase) [![Version](https://badge.fury.io/js/bookshelf-modelbase.svg)](http://badge.fury.io/js/bookshelf-modelbase) [![Downloads](http://img.shields.io/npm/dm/bookshelf-modelbase.svg)](https://www.npmjs.com/package/bookshelf-modelbase)

##Why
[Bookshelf.js](https://github.com/tgriesser/bookshelf) is awesome. However,
we found ourselves extending `bookshelf.Model` for the same reasons over and
over - parsing and formatting (to and from DB) niceties, adding timestamps, and
validating data on save, for example. Since these are problems you'll likely
have to solve for most use cases of Bookshelf, it made sense to provide a
convenient set of core model features.

### Please note
* `bookshelf-modelbase` will not force you to use it for all your models.
If you want to use it for some and not others, nothing bad will happen.

* `bookshelf-modelbase` requires you to pass in an initialized instance
of bookshelf, meaning that you can configure bookshelf however you please.
Outside of overriding `bookshelf.Model`, there is nothing you can do to
your bookshelf instance that will break `bookshelf-modelbase`.

### Features
* Adds timestamps (`createdAt` and `updatedAt`)

* Validate own attributes on save using [Joi](https://github.com/hapijs/joi).
You can pass in a validation object as a class attribute when you extend
`bookshelf-modelbase` - see below for usage.

* Writes attributes to the db as `snake_case`,
but exposes them in code as `camelCase`.

* Naive CRUD methods - `findAll`, `findOne`, `create`, `update`, and `destroy`

##Usage
```javascript
var db        = require(knex)(require('./knexfile'));
var bookshelf = require('bookshelf')(db);
// Pass an initialized bookshelf instance
var ModelBase = require('bookshelf-modelbase')(bookshelf);

var User = ModelBase.extend({
  tableName: 'users'
}, {
  // validation is passed to Joi.object(), so use a raw object
  validate: {
    firstName: Joi.string()
  }
});

User.create({ firstName: 'Grayson' })
.then(function () {
  return User.findOne({ firstName: 'Grayson' }, { require: true });
})
.then(function (grayson) {
  // passes patch: true to .save() by default
  return User.update({ firstName: 'Basil' }, { id: grayson.id });
})
.then(function (basil) {
  return User.destroy({ id: basil.id });
})
.then(function () {
  return User.findAll();
})
.then(function (collection) {
  console.log(collection.models.length); // => 0
})

```

### CRUD
```javascript
/**
  * Naive findAll - fetches all data for `this`
  * @param {Object} options (optional)
  * @return {Promise(bookshelf.Collection)} Bookshelf Collection of all Models
  */
findAll: function (options) {
  return bookshelf.Collection.forge([], { model: this }).fetch(options);
},

/**
  * Naive findOne - fetch data for `this` matching data
  * @param {Object} data
  * @param {Object} options (optional)
  * @return {Promise(bookshelf.Model)} single Model
  */
findOne: function (data, options) {
  return this.forge(data).fetch(options);
},

/**
  * Naive add - create and save a model based on data
  * @param {Object} data
  * @param {Object} options (optional)
  * @return {Promise(bookshelf.Model)} single Model
  */
create: function (data, options) {
  return this.forge(data)
  .save(null, options);
},

/**
  * Naive update - update a model based on data
  * @param {Object} data
  * @param {Object} options
  * @return {Promise(bookshelf.Model)} edited Model
  */
update: function (data, options) {
  _.defaults(options, {
    patch: true
  });
  return this.forge({ id: options.id }).fetch(options)
  .then(function (model) {
    if (model) {
      return model.save(data, options);
    }
  })
},

/**
  * Naive destroy
  * @param {Object} options
  * @return {Promise(bookshelf.Model)} empty Model
  */
destroy: function (options) {
  return this.forge({ id: options.id })
  .destroy(options);
}
```
