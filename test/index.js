/* global describe, before, beforeEach, it */

var Joi = require('joi')
var chai = require('chai')
var expect = chai.expect
var db = require('./db')
var bookshelf = require('bookshelf')(db)
require('../lib/index')(bookshelf)

describe('modelBase', function () {
  var specimen
  var SpecimenClass

  before(function () {
    return db.migrate.latest()
  })

  beforeEach(function () {
    SpecimenClass = bookshelf.Model.extend({
      tableName: 'test_table',
      validate: {
        first_name: Joi.string().valid('hello', 'goodbye', 'yo').required(),
        last_name: Joi.string().allow(null)
      }
    })

    specimen = new SpecimenClass({
      first_name: 'hello'
    })

    return specimen.save()
  })

  describe('initialize', function () {
    it('should error if not passed bookshelf object', function () {
      expect(function () {
        require('../lib/index')()
      }).to.throw(/Must pass an initialized bookshelf instance/)
    })

    it('should default to any validation', function () {
      specimen = new bookshelf.Model()
      expect(specimen.validate.isJoi).to.eql(true)
      expect(specimen.validate._type).to.eql('any')
    })
  })

  describe('validateSave', function () {
    it('should allow extended Joi object', function () {
      SpecimenClass = bookshelf.Model.extend({
        tableName: 'test_table',
        validate: Joi.object().keys({
          first_name: Joi.string().valid('hello', 'goodbye')
        })
      })

      specimen = new SpecimenClass({
        first_name: 'hello'
      })

      return specimen.save()
      .then(function (model) {
        expect(model).to.exist()
      })
    })

    it('should validate own attributes', function () {
      return expect(specimen.validateSave()).to.contain({
        first_name: 'hello'
      })
    })

    it('should error on invalid attributes', function () {
      specimen.set('first_name', 1)
      expect(function () {
        specimen.validateSave()
      }).to.throw(/ValidationError/)
    })

    it('should work with updates method specified', function () {
      return SpecimenClass
      .where({ first_name: 'hello' })
      .save({ last_name: 'world' }, { patch: true, method: 'update', require: false })
      .then(function (model) {
        return expect(model.get('last_name')).to.equal('world')
      })
    })

    it('should work with model id specified', function () {
      return SpecimenClass.forge({ id: 1 })
      .save({ last_name: 'world' }, { patch: true, require: false })
      .then(function (model) {
        return expect(model.get('last_name')).to.equal('world')
      })
    })
  })

  describe('constructor', function () {
    it('should itself be extensible', function () {
      return expect(bookshelf.Model.extend({ tablefirst_name: 'test' }))
        .to.itself.respondTo('extend')
    })
  })

  describe('findAll', function () {
    it('should return a collection', function () {
      return SpecimenClass.findAll()
      .then(function (collection) {
        return expect(collection).to.be.instanceof(bookshelf.Collection)
      })
    })
  })

  describe('findOne', function () {
    it('should return a model', function () {
      return SpecimenClass.findOne()
      .then(function (model) {
        expect(model).to.be.instanceof(SpecimenClass)
      })
    })
  })

  describe('create', function () {
    it('should return a model', function () {
      return SpecimenClass.create({
        first_name: 'hello'
      })
      .then(function (model) {
        expect(model.id).to.not.eql(specimen.id)
      })
    })
  })

  describe('update', function () {
    it('should return a model', function () {
      expect(specimen.get('first_name')).to.not.eql('goodbye')
      return SpecimenClass.update({
        first_name: 'goodbye'
      }, {
        id: specimen.get('id')
      })
      .then(function (model) {
        expect(model.get('id')).to.eql(specimen.get('id'))
        expect(model.get('first_name')).to.eql('goodbye')
      })
    })

    it('should return if require:false and not found', function () {
      return SpecimenClass.update({
        first_name: 'goodbye'
      }, {
        id: -1,
        require: false
      })
      .then(function (model) {
        expect(model).to.eql(undefined)
      })
    })
  })

  describe('destroy', function () {
    it('should destroy the model', function () {
      return SpecimenClass.forge({ first_name: 'hello' })
      .save()
      .bind({})
      .then(function (model) {
        this.modelId = model.id
        return SpecimenClass.destroy({ id: this.modelId })
      })
      .then(function (model) {
        return SpecimenClass.findOne({ id: this.modelId })
      })
      .catch(function (err) {
        expect(err.message).to.eql('EmptyResponse')
      })
    })
  })

  describe('findOrCreate', function () {
    it('should find an existing model', function () {
      return SpecimenClass.findOrCreate({ id: specimen.id })
      .then(function (model) {
        return expect(model.id).to.eql(specimen.id)
      })
    })

    it('should create when model not found', function () {
      return SpecimenClass.findOrCreate({
        first_name: 'yo'
      })
      .then(function (model) {
        return expect(model.id).to.not.eql(specimen.id)
      })
    })
  })
})
