ModelBase ![Build Status](https://travis-ci.org/graysonc/modelbase.svg?branch=master)
=========


##Usage
```javascript
var db        = require(knex)(require('./knexfile'));
var bookshelf = require('bookshelf')(db);
// Pass an initialized bookshelf instance
var ModelBase = require('model-base')(bookshelf);

var User = ModelBase.extend({
}, {
  validation: [Joi validation object]
})
```
