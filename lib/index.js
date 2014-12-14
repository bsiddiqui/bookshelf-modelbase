var _        = require('lodash');
    _.str    = require('underscore.string');
var Joi      = require('joi');

function modelBase(bookshelf, params) {
  if (!bookshelf) {
    throw new Error('Must pass an initialized bookshelf instance');
  }

  var model = bookshelf.Model.extend({
    initialize: function (attrs, options) {
      this.validation || (this.validation = Joi.any());
      this.on('saving', this.validateSave);
    },

    hasTimestamps: ['createdAt', 'updatedAt'],

    validateSave: function () {
      var validation = Joi.validate(this.attributes, this.validation);
      if (validation.errors) {
        throw new Error(validation.errors);
      } else {
        return validation.value;
      }
    },

    parse: function (response) {
      return  _.reduce(response, function (memo, val, key) {
        memo[_.str.camelize(key)] = val;
        return memo;
      }, {});
    },

    // camelCase attributes -> snake_case db columns
    format: function (attrs) {
      return _.reduce(attrs, function (memo, val, key) {
        memo[_.str.underscored(key)] = val;
        return memo;
      }, {});
    },
  });

  return model;
};

module.exports = modelBase;

