var $ = require('jquery')
var _ = require('underscore')
var Backbone = require('backbone')
var Promise = require('bluebird')
var BaseProvider = require('./baseprovider')
var squel = require('squel')
var LocalFields = require('./local-fields')

module.exports = BaseProvider.extend({
  model: Backbone.Model.extend({
    idAttribute: 'label'
  }),
  initialize: function (models, options) {
    this.options = options || {}
    this.label = options.boundariesLabel || 'objectid'
    this.idAttribute = options.boundariesId || 'objectid'
    BaseProvider.prototype.initialize.apply(this, arguments)
    this.url = 'data/' + this.config.filename
  },
  fieldsCollection: LocalFields,
  exportUrl: function () {
    return this.url
  },
  parse: function(resp, options) {
    return resp
  },
  getRecordCount: function () {
    return Promise.resolve(this.length)
  },
  getFields: function () {
    var fields = [
      { data: "properties.ORGANIZATION_NAME" },
      { data: "properties.ORGANIZATION_ADDRESS"},
      { data: "properties.PRIMARY_NAME"},
      { data: "properties.PRIMARY_EMAIL"},
      { data: "properties.PRIMARY_PHONE"}
      ];
    return Promise.resolve(fields);
  }
})
