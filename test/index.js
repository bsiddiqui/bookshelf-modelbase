var Joi       = require('joi');
var sinon     = require('sinon');
var mocha     = require('mocha');
var chai      = require('chai');
var expect    = chai.expect;
var sinon     = require('sinon');
var db        = require('./db');
var bookshelf = require('bookshelf')(db);
var ModelBase = require('../lib/index')(bookshelf);

describe('modelBase', function () {
  var specimen;
  var specimenClass;

  before(function () {
    return db.migrate.latest();
  });

  beforeEach(function () {
    specimenClass = ModelBase.extend({
      tableName: 'test_table',
      validate: { name: Joi.string().valid('hello', 'goodbye') }
    });

    specimen = new specimenClass({
      name: 'hello'
    });

    return specimen.save();
  });

  describe('initialize', function () {
    it('should error if not passed bookshelf object', function () {
      expect(function () {
        require('../lib/index')();
      }).to.throw(/Must pass an initialized bookshelf instance/);
    });

    it('should default to any validation', function () {
      specimen = new ModelBase();
      expect(specimen.validate.isJoi).to.eql(true);
      expect(specimen.validate._type).to.eql('any');
    });
  })

  describe('parse', function () {
    it('should convert snake case to camel case', function () {
      return expect(specimen.parse({ variable_name: 'snake_case' }))
        .to.eql({ variableName: 'snake_case' })
    });
  });

  describe('format', function () {
    it('should convert camel case to snake case', function () {
      return expect(specimen.format({ variableName: 'snake_case' }))
        .to.eql({ variable_name: 'snake_case' })
    });
  });

  describe('validateSave', function () {
    it('should validate own attributes', function () {
      return expect(specimen.validateSave()).to.contain({
        name: 'hello'
      });
    });

    it('should error on invalid attributes', function () {
      specimen.set('name', 1);
      expect(function () {
        specimen.validateSave();
      }).to.throw(/ValidationError/);
    });
  });

  describe('constructor', function () {
    it('should itself be extensible', function () {
      return expect(ModelBase.extend({ tableName: 'test' }))
        .to.itself.respondTo('extend');
    });
  });

  describe('findAll', function () {
    it('should return a collection', function () {
      return specimenClass.findAll()
      .then(function (collection) {
        return expect(collection).to.be.instanceof(bookshelf.Collection);
      })
    });
  });

  describe('findOne', function () {
    it('should return a model', function () {
      return specimenClass.findOne()
      .then(function (model) {
        expect(model).to.be.instanceof(specimenClass);
      });
    });
  });

  describe('create', function () {
    it('should return a model', function () {
      return specimenClass.create({
        name: 'hello'
      })
      .then(function (model) {
        return expect(model.id).to.not.eql(specimen.id);
      });
    });
  });

  describe('update', function () {
    it('should return a model', function () {
      return specimenClass.forge({
        name: 'goodbye'
      }, { id: specimen.id })
      .save()
      .bind({})
      .then(function (model) {
        this.modelId = model.id;
        return specimenClass.update({
          name: 'hello'
        }, { id: this.modelId });
      })
      .then(function () {
        return specimenClass.findOne({ id: this.modelId });
      })
      .then(function (model) {
        return expect(model.get('name')).to.eql('hello');
      });
    });
  });

  describe('destroy', function () {
    it('should destroy the model', function () {
      return specimenClass.forge({ name: 'hello' })
      .bind({})
      .save()
      .then(function (model) {
        this.modelId = model.id;
        return specimenClass.destroy({ id: this.modelId })
      })
      .then(function (model) {
        return specimenClass.findOne({ id: this.modelId });
      })
      .then(function (model) {
        return expect(model).to.eql(null);
      });
    });
  });
});
