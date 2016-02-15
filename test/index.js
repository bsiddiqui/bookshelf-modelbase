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
  })

  describe('validateSave', function () {
    it('should allow extended Joi object', function () {
      SpecimenClass = ModelBase.extend({
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
      }).to.throw(/first_name must be a string/)
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

    it('should not validate when  Model.validate is not present', function () {
      var Model = ModelBase.extend({ tableName: 'test_table' })
      return Model.forge({ id: 1 })
      .save('first_name', 'notYoName')
      .then(function (model) {
        return expect(model.get('first_name')).to.equal('notYoName')
      })
    })
  })

  describe('constructor', function () {
    it('should itself be extensible', function () {
      return expect(ModelBase.extend({ tablefirst_name: 'test' }))
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
        expect(model.id).to.eql(specimen.id)
        expect(model.get('first_name')).to.equal('hello')
      })
    })

    it('should find with options', function () {
      return SpecimenClass.findOrCreate({ id: specimen.id }, { columns: 'id' })
      .then(function (model) {
        expect(model.id).to.eql(specimen.id)
        expect(model.get('first_name')).to.equal(undefined)
      })
    })

    it('should create when model not found', function () {
      return SpecimenClass.findOrCreate({
        first_name: 'hello',
        last_name: '' + new Date()
      })
      .then(function (model) {
        expect(model.id).to.not.eql(specimen.id)
      })
    })

    it('should apply defaults if creating', function () {
      var date = '' + new Date()

      return SpecimenClass.findOrCreate({
        last_name: date
      }, {
        first_name: 'hello'
      })
      .then(function (model) {
        expect(model.id).to.not.eql(specimen.id)
        expect(model.get('first_name')).to.equal('hello')
        expect(model.get('last_name')).to.equal(date)
      })
    })

    it('should work with  defaults and options', function () {
      var date = '' + new Date()

      return SpecimenClass.findOrCreate({
        last_name: date
      }, {
        first_name: 'hello'
      }, {
        columns: ['first_name', 'last_name']
      })
      .then(function (model) {
        expect(model.get('id')).to.equal(undefined)
        expect(model.get('first_name')).to.equal('hello')
        expect(model.get('last_name')).to.equal(date)
      })
    })

    it('should not apply defaults if model found', function () {
      var date = '' + new Date()

      return SpecimenClass.findOrCreate({
        first_name: 'hello'
      }, {
        last_name: date
      })
      .then(function (model) {
        expect(model.id).to.not.eql(specimen.id)
        expect(model.get('first_name')).to.equal('hello')
        expect(model.get('last_name')).to.not.equal(date)
      })
    })
  })

  describe('upsert', function () {
    it('should update if existing model found', function () {
      return SpecimenClass.create({
        first_name: 'hello',
        last_name: 'upsert'
      })
      .bind({})
      .then(function (model) {
        this.createdModelId = model.id
        return SpecimenClass.upsert({
          last_name: 'upsert'
        }, {
          last_name: 'success'
        })
      })
      .then(function (model) {
        expect(model.get('first_name')).to.equal('hello')
        expect(model.get('last_name')).to.equal('success')
        expect(model.id).to.equal(this.createdModelId)
      })
    })

    it('should create if existing model not found', function () {
      return SpecimenClass.upsert({
        first_name: 'goodbye',
        last_name: 'update'
      }, {
        last_name: 'updated'
      })
      .then(function (model) {
        expect(model.get('first_name')).to.equal('goodbye')
        expect(model.get('last_name')).to.equal('updated')
      })
    })
  })
})
