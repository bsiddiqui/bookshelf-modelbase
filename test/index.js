var Joi       = require('joi');
var mocha     = require('mocha');
var chai      = require('chai'),
    expect    = chai.expect;
var db        = require('./db');
    bookshelf = require('bookshelf')(db);
    ModelBase = require('../index')(bookshelf);

describe('model base', function () {
  describe('_parse', function () {
    it('should convert snake case to camel case', function () {
      expect(ModelBase._parse({ variable_name: 'snake_case' }))
        .to.eql({ variableName: 'snake_case' })
    });
  });

  describe('_format', function () {
    it('should convert camel case to snake case', function () {
      expect(ModelBase._format({ variableName: 'snake_case' }))
        .to.eql({ variable_name: 'snake_case' })
    });
  });

  describe('validateSave', function () {
    it('should validate own attributes', function () {
      var specimen = new ModelBase({ a: 'hello' }, {
        validation: { a: Joi.string().valid('hello') }
      });

      expect(specimen.validateSave().value).to.eql(specimen.attributes);

      specimen.set('a', 1);

      expect(specimen.validateSave().error).to.be.ok();
    });
  });
});
