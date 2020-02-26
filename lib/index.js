var Joi = require('joi')
var difference = require('lodash.difference')

module.exports = function modelBase (bookshelf, params) {
  if (!bookshelf) {
    throw new Error('Must pass an initialized bookshelf instance')
  }

  var bookshelfModel = bookshelf.Model

  var model = bookshelf.Model.extend({
    constructor: function () {
      bookshelfModel.apply(this, arguments)

      if (this.validate) {
        var baseValidation = {
          // id might be number or string, for optimization
          id: Joi.any().optional(),
          created_at: Joi.date().optional(),
          updated_at: Joi.date().optional()
        }

        this.validate = this.validate.isJoi
          ? this.validate.keys(baseValidation)
          : Joi.object(this.validate).keys(baseValidation)

        this.on('saving', this.validateSave)
      }
    },

    hasTimestamps: ['created_at', 'updated_at'],

    validateSave: function (model, attrs, options) {
      var validation
      // model is not new or update method explicitly set
      if ((model && !model.isNew()) || (options && (options.method === 'update' || options.patch === true))) {
        var schemaKeys = this.validate._inner.children.map(function (child) {
          return child.key
        })
        var presentKeys = Object.keys(attrs)
        var optionalKeys = difference(schemaKeys, presentKeys)
        // only validate the keys that are being updated
        validation = Joi.validate(
          attrs,
          optionalKeys.length
            // optionalKeys() doesn't like empty arrays
            ? this.validate.optionalKeys(optionalKeys)
            : this.validate
        )
      } else {
        validation = Joi.validate(this.attributes, this.validate)
      }

      if (validation.error) {
        validation.error.tableName = this.tableName

        throw validation.error
      } else {
        this.set(validation.value)
        return validation.value
      }
    }

  }, {

    /**
     * Select a collection based on a query
     * @param {Object} [filter]
     * @param {Object} [options] Options used of model.fetchAll
     * @return {Promise(bookshelf.Collection)} Bookshelf Collection of Models
     */
    findAll: function (filter, options) {
      return this.forge().where(filter || {}).fetchAll(options)
    },

    /**
     * Find a model based on it's ID
     * @param {String} id The model's ID
     * @param {Object} [options] Options used of model.fetch
     * @return {Promise(bookshelf.Model)}
     */
    findById: function (id, options) {
      return this.findOne({ [this.prototype.idAttribute]: id }, options)
    },

    /**
     * Select a model based on a query
     * @param {Object} [query]
     * @param {Object} [options] Options for model.fetch
     * @param {Boolean} [options.require=false]
     * @return {Promise(bookshelf.Model)}
     */
    findOne: function (query, options = {}) {
      options = Object.assign({ require: true }, options)
      return this.forge(query).fetch(options)
    },

    /**
     * Insert a model based on data
     * @param {Object} data
     * @param {Object} [options] Options for model.save
     * @return {Promise(bookshelf.Model)}
     */
    create: function (data, options) {
      return this.forge(data)
        .save(null, options)
    },

    /**
     * Update a model based on data
     * @param {Object} data
     * @param {Object} options Options for model.fetch and model.save
     * @param {String|Integer} options.id The id of the model to update
     * @param {Boolean} [options.patch=true]
     * @param {Boolean} [options.require=true]
     * @return {Promise(bookshelf.Model)}
     */
    update: function (data, options = {}) {
      options = Object.assign({ patch: true, require: true }, options)
      return this.forge({ [this.prototype.idAttribute]: options.id }).fetch(options)
        .then(function (model) {
          return model ? model.save(data, options) : undefined
        })
    },

    /**
     * Destroy a model by id
     * @param {Object} options
     * @param {String|Integer} options.id The id of the model to destroy
     * @param {Boolean} [options.require=true]
     * @return {Promise(bookshelf.Model)} empty model
     */
    destroy: function (options = {}) {
      options = Object.assign({ require: true }, options)
      return this.forge({ [this.prototype.idAttribute]: options.id })
        .destroy(options)
    },

    /**
      * Select a model based on data and insert if not found
      * @param {Object} data
      * @param {Object} [options] Options for model.fetch and model.save
      * @param {Object} [options.defaults] Defaults to apply to a create
      * @return {Promise(bookshelf.Model)} single Model
      */
    findOrCreate: function (data, options = {}) {
      return this.findOne(data, Object.assign({}, options, { require: false }))
        .bind(this)
        .then(function (model) {
          var defaults = (options && options.defaults) || {}
          return model || this.create(Object.assign(defaults, data), options)
        })
    },

    /**
     * Select a model based on data and update if found, insert if not found
     * @param {Object} selectData Data for select
     * @param {Object} updateData Data for update
     * @param {Object} [options] Options for model.save
     */
    upsert: function (selectData, updateData, options = {}) {
      return this.findOne(selectData, Object.assign({}, options, { require: false }))
        .bind(this)
        .then(function (model) {
          return model
            ? model.save(
              updateData,
              Object.assign({ patch: true, method: 'update' }, options)
            )
            : this.create(
              Object.assign({}, selectData, updateData),
              Object.assign({}, options, { method: 'insert' })
            )
        })
    }
  })

  return model
}

module.exports.pluggable = function (bookshelf, params) {
  bookshelf.Model = module.exports.apply(null, arguments)
}
