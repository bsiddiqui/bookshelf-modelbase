ModelBase ![Build Status](https://travis-ci.org/bsiddiqui/bookshelf-modelbase.svg?branch=master)
=========


##Usage
```javascript
var db        = require(knex)(require('./knexfile'));
var bookshelf = require('bookshelf')(db);
// Pass an initialized bookshelf instance
var ModelBase = require('bookshelf-modelbase')(bookshelf);

var User = ModelBase.extend({
}, {
  validation: [Joi validation object]
})
```
