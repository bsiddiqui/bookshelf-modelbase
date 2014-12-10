var _       = require('lodash');
    _.str   = require('underscore.string');
var Joi     = require('joi');
var Promise = require('bluebird');

function modelBase(bookshelf, params) {
  if (!bookshelf) {
    throw new Error('Must pass an initialized bookshelf instance');
  }

  var model = bookshelf.Model.extend({
      initialize: function (attrs, options) {
        this.validation = options.validation || Joi.any();
        this.on('saving', this.validateSave);
      },

      validateSave: function () {
        return Joi.validate(this.attributes, this.validation);
      },
    }, {

      // snake_case db columns -> camelCase attributes
      _parse: function (response) {
        return  _.reduce(response, function (memo, val, key) {
          memo[_.str.camelize(key)] = val;
          return memo;
        }, {});
      },

      parse: function (response) {
        return this._parse(response);
      },

      // camelCase attributes -> snake_case db columns
      _format: function (attrs) {
        return _.reduce(attrs, function (memo, val, key) {
          memo[_.str.underscored(key)] = val;
          return memo;
        }, {});
      },

      format: function (attrs) {
        return this._format(attrs);
      }
  });

  return model;
};

module.exports = modelBase;

