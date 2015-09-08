/* global describe, before, beforeEach, it */

var Joi = require('joi')
var chai = require('chai')
var expect = chai.expect
var db = require('./db')
var bookshelf = require('bookshelf')(db)
var ModelBase = require('../lib/index')(bookshelf)

describe('modelBase', function () {
  var specimen
  var SpecimenClass

  before(function () {
    return db.migrate.latest()
  })

  beforeEach(function () {
    SpecimenClass = ModelBase.extend({
      tableName: 'test_table',
      validate: {
        name: Joi.string().valid('hello', 'goodbye')
      }
    })

    specimen = new SpecimenClass({
      name: 'hello'
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
      specimen = new ModelBase()
      expect(specimen.validate.isJoi).to.eql(true)
      expect(specimen.validate._type).to.eql('any')
    })
  })

  describe('validateSave', function () {
    it('should validate own attributes', function () {
      return expect(specimen.validateSave()).to.contain({
        name: 'hello'
      })
    })

    it('should error on invalid attributes', function () {
      specimen.set('name', 1)
      expect(function () {
        specimen.validateSave()
      }).to.throw(/ValidationError/)
    })
  })

  describe('constructor', function () {
    it('should itself be extensible', function () {
      return expect(ModelBase.extend({ tableName: 'test' }))
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
        name: 'hello'
      })
      .then(function (model) {
        return expect(model.id).to.not.eql(specimen.id)
      })
    })
  })

  describe('update', function () {
    it('should return a model', function () {
      return SpecimenClass.forge({
        name: 'goodbye'
      }, { id: specimen.id })
      .save()
      .bind({})
      .then(function (model) {
        this.modelId = model.id
        return SpecimenClass.update({
          name: 'hello'
        }, { id: this.modelId })
      })
      .then(function () {
        return SpecimenClass.findOne({ id: this.modelId })
      })
      .then(function (model) {
        return expect(model.get('name')).to.eql('hello')
      })
    })
  })

  describe('destroy', function () {
    it('should destroy the model', function () {
      return SpecimenClass.forge({ name: 'hello' })
      .bind({})
      .save()
      .then(function (model) {
        this.modelId = model.id
        return SpecimenClass.destroy({ id: this.modelId })
      })
      .then(function (model) {
        return SpecimenClass.findOne({ id: this.modelId })
      })
      .then(function (model) {
        return expect(model).to.eql(null)
      })
    })
  })

  describe('findOrCreate', function () {
    it('should find an existing model', function () {
      return SpecimenClass.findOrCreate()
      .then(function (model) {
        expect(model).to.be.instanceof(SpecimenClass)
      })
    })

    it('should create when model not found', function () {
      return SpecimenClass.findOrCreate({
        name: 'goodbye'
      })
      .then(function (model) {
        return expect(model.id).to.not.eql(specimen.id)
      })
    })
  })
})
