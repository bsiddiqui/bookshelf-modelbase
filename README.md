ModelBase ![Build Status](https://travis-ci.org/bsiddiqui/bookshelf-modelbase.svg?branch=master)
=========

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


##Usage
```javascript
var db        = require(knex)(require('./knexfile'));
var bookshelf = require('bookshelf')(db);
// Pass an initialized bookshelf instance
var ModelBase = require('bookshelf-modelbase')(bookshelf);

var User = ModelBase.extend({
}, {
  // validation is passed to Joi.object(), so use a raw object
  validation: {
    firstName: Joi.string()
  }
})
```
