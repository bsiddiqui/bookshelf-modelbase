var _        = require('lodash');
    _.str    = require('underscore.string');
var Joi      = require('joi');

module.exports = function modelBase(bookshelf, params) {
  if (!bookshelf) {
    throw new Error('Must pass an initialized bookshelf instance');
  }

  var model = bookshelf.Model.extend({
    initialize: function (attrs, options) {
      if (this.validate) {
        this.validate = Joi.object(this.validate).keys({
          // id might be number or string, for optimization
          id: Joi.any().optional(),
          createdAt: Joi.date().optional(),
          updatedAt: Joi.date().optional()
        })
      } else {
        this.validate = Joi.any();
      }

      this.on('saving', this.validateSave);
    },

    hasTimestamps: ['createdAt', 'updatedAt'],

    validateSave: function () {
      var validation = Joi.validate(this.attributes, this.validate);
      if (validation.error) {
        throw new Error(validation.error);
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
  }, {

    /* Model CRUD */

    /**
      * Naive findAll - fetches all data for `this`
      * @param {Object} filter (optional)
      * @param {Object} options (optional)
      * @return {Promise(bookshelf.Collection)} Bookshelf Collection of Models
      */
    findAll: function (filter, options) {
      return this.forge(filter).fetchAll(options);
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

  });

  return model;
};
