var Joi       = require('joi');
var sinon     = require('sinon');
var mocha     = require('mocha');
var chai      = require('chai'),
    expect    = chai.expect;
var db        = require('./db');
    bookshelf = require('bookshelf')(db);
    ModelBase = require('../lib/index')(bookshelf);

describe('model base', function () {
  var specimen;

  beforeEach(function () {
    var specimenClass = ModelBase.extend({}, {
      validation: {
        a: Joi.string().valid('test')
      }
    });
    specimen = new ModelBase({ name: 'hello' }, {
      validation: { name: Joi.string().valid('hello') }
    });
  });

  describe('parse', function () {
    it('should convert snake case to camel case', function () {
      expect(specimen.parse({ variable_name: 'snake_case' }))
        .to.eql({ variableName: 'snake_case' })
    });
  });

  describe('format', function () {
    it('should convert camel case to snake case', function () {
      expect(specimen.format({ variableName: 'snake_case' }))
        .to.eql({ variable_name: 'snake_case' })
    });
  });

  describe('validateSave', function () {
    it('should validate own attributes', function () {
      expect(specimen.validateSave()).to.contain({
        name: 'hello'
      });

      specimen.set('name', 1);
      return expect(specimen.validateSave).to.throw()
    });
  });

  describe('constructor', function () {
    it('should itself be extensible', function () {
      expect(ModelBase.extend({ tableName: 'test' }))
        .to.itself.respondTo('extend');
    });
  });
});
