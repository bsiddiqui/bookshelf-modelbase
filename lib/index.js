var extend = require('xtend')
var Joi = require('joi')
var difference = require('lodash.difference')

module.exports = function modelBase (bookshelf, params) {
  if (!bookshelf) {
    throw new Error('Must pass an initialized bookshelf instance')
  }

  var modelPrototype = bookshelf.Model.prototype

  var model = bookshelf.Model.extend({
    initialize: function (attrs, options) {
      modelPrototype.initialize.call(this)

      if (this.validate) {
        var baseValidation = {
          // id might be number or string, for optimization
          id: Joi.any().optional(),
          created_at: Joi.date().optional(),
          updated_at: Joi.date().optional()
        }

        this.validate = this.validate.isJoi ?
          this.validate.keys(baseValidation) :
          Joi.object(this.validate).keys(baseValidation)
      } else {
        this.validate = Joi.any()
      }

      this.on('saving', this.validateSave)
    },

    hasTimestamps: ['created_at', 'updated_at'],

    validateSave: function (model, attrs, options) {
      var validation
      // model is not new or update method explicitly set
      if ((model && !model.isNew()) || (options && options.method === 'update')) {
        var schemaKeys = this.validate._inner.children.map(function (child) {
          return child.key
        })
        var presentKeys = Object.keys(attrs)
        var optionalKeys = difference(schemaKeys, presentKeys)
        // only validate the keys that are being updated
        validation = Joi.validate(attrs, this.validate.optionalKeys(optionalKeys))
      } else {
        validation = Joi.validate(this.attributes, this.validate)
      }

      if (validation.error) {
        throw validation.error
      } else {
        return validation.value
      }
    }

  }, {

    /* Model CRUD */

    /**
      * Naive findAll - fetches all data for `this`
      * @param {Object} filter (optional)
      * @param {Object} options (optional)
      * @return {Promise(bookshelf.Collection)} Bookshelf Collection of Models
      */
    findAll: function (filter, options) {
      filter = extend({}, filter)
      return this.forge().query({ where: filter }).fetchAll(options)
    },

    /**
      * Naive findOne - fetch data for `this` matching data
      * @param {Object} data
      * @param {Object} options (optional)
      * @return {Promise(bookshelf.Model)} single Model
      */
    findOne: function (data, options) {
      options = extend({ require: true }, options)
      return this.forge(data).fetch(options)
    },

    /**
      * Naive add - create and save a model based on data
      * @param {Object} data
      * @param {Object} options (optional)
      * @return {Promise(bookshelf.Model)} single Model
      */
    create: function (data, options) {
      return this.forge(data)
      .save(null, options)
    },

    /**
      * Naive update - update a model based on data
      * @param {Object} data
      * @param {Object} options
      * @return {Promise(bookshelf.Model)} edited Model
      */
    update: function (data, options) {
      options = extend({ patch: true, require: true }, options)
      return this.forge({ id: options.id }).fetch(options)
      .then(function (model) {
        return model ? model.save(data, options) : undefined
      })
    },

    /**
      * Naive destroy
      * @param {Object} options
      * @return {Promise(bookshelf.Model)} empty Model
      */
    destroy: function (options) {
      options = extend({ require: true }, options)
      return this.forge({ id: options.id })
      .destroy(options)
    },

    /**
      * Find or create - try and find the model, create one if not found
      * @param {Object} data
      * @param {Object} options
      * @return {Promise(bookshelf.Model)} single Model
      */
    findOrCreate: function (data, options) {
      options = extend({ require: false }, options)
      return this.findOne(data, options)
      .bind(this)
      .then(function (model) {
        return model ? model : this.create(data, options)
      })
    }

  })

  bookshelf.Model = model
}
