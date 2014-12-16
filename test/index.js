var Joi       = require('joi');
var sinon     = require('sinon');
var mocha     = require('mocha');
var chai      = require('chai');
var expect    = chai.expect;
var db        = require('./db');
var bookshelf = require('bookshelf')(db);
var ModelBase = require('../lib/index')(bookshelf);

describe('modelBase', function () {
  var specimen;

  beforeEach(function () {
    specimen = new ModelBase({ name: 'hello' }, {
      validate: { name: Joi.string().valid('hello') }
    });
  });

  describe('initialize', function () {
    it('should error if not passed bookshelf object', function () {
      expect(function () {
        require('../lib/index')();
      }).to.throw(/Must pass an initialized bookshelf instance/);
    });

    it('should default to any validate', function () {
      specimen = new ModelBase();
      expect(specimen.validate.isJoi).to.eql(true);
      expect(specimen.validate._type).to.eql('any');
    });
  })

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
      expect(ModelBase.extend({ tableName: 'test' }))
        .to.itself.respondTo('extend');
    });
  });
});
