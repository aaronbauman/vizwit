var $ = require('jquery')
var _ = require('underscore')
var Promise = require('bluebird')
var BaseProvider = require('./baseprovider')
var squel = require('squel')
var CartoFields = require('./carto-fields')
var Backbone = require('backbone')

var model = Backbone.Model.extend({
  idAttribute: 'label',
})

// Wrap an optional error callback with a fallback error event.
var wrapError = function(model, options) {
  var error = options.error;
  options.error = function(resp) {
    if (error) error.call(options.context, model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

module.exports = BaseProvider.extend({
  model: model,
  initialize: function (models, options) {
    BaseProvider.prototype.initialize.apply(this, arguments)
  },
  fieldsCollection: CartoFields,
  fetch: function(options) {
    options = _.extend({parse: true}, options);
    options.data = {q: this.getPostData()}
    options.method = 'POST'
    return Backbone.Collection.prototype.fetch.call(this, options);
  },
  getPostData: function () {
    var filters = this.config.baseFilters.concat(this.getFilters())
    var query = squel.select()
    query.from(this.config.dataset)

    // Aggregate & group by
    if (this.config.valueField || this.config.aggregateFunction || this.config.groupBy) {
      // If valueField specified, use it as the value
      if (this.config.valueField) {
        query.field(this.config.valueField + ' as value')
        // Otherwise use the aggregateFunction / aggregateField as the value
      } else {
        // If group by was specified but no aggregate function, use count by default
        if (!this.config.aggregateFunction) this.config.aggregateFunction = 'count'

        // Aggregation
        query.field(this.config.aggregateFunction + '(' + (this.config.aggregateField || '*') + ') as value')
      }

      // Group by
      if (this.config.groupBy) {
        query.field(this.config.groupBy + ' as label')
          .group(this.config.groupBy)

        // Order by (only if there will be multiple results)
        if (this.config.order) {
          query.order(this.config.order, '')
        } else {
          query.order('value', false)
        }
      }
    } else {
      // Offset
      if (this.config.offset) query.offset(this.config.offset)

      // Order by
      query.order(this.config.order || 'cartodb_id', '')
    }

    // Where
    if (filters.length) {
      // Parse filter expressions into basic SQL strings and concatenate
      filters = _.map(filters, function (filter) {
        return this.parseExpression(filter.field, filter.expression)
      }, this).join(' and ')
      query.where(filters)
    }

    // Full text search
    // if (this.config.search) query.q(this.config.search)
    if (this.config.search) {
      var fullTextQuery = this.config.dataset + '::text ' +
        "ILIKE '%25" + this.config.search + "%25'"
      query.where(fullTextQuery)
    }

    // Limit
    if (this.config.limit) query.limit(this.config.limit)

    return query.toString()
  },
  url: function () {
    return 'https://' + this.config.domain + '/api/v2/sql'
  },
  exportUrl: function () {
    return 'https://' + this.config.domain + '/dataset/' + this.config.dataset
  },
  parse: function (response) {
    return response.rows
  },
  getRecordCount: function () {
    var self = this
    // If recordCount has already been fetched, return it as a promise
    if (this.recordCount) {
      return Promise.resolve(this.recordCount)
    } else {
      // Save current values
      var oldAggregateFunction = this.config.aggregateFunction
      var oldGroupBy = this.config.groupBy

      // Change values in order to get the URL
      this.config.aggregateFunction = 'count'
      this.config.groupBy = null

      // Get the URL
      var data = {q: this.getPostData()}
      // console.log('data', data)
      // Set the values back
      this.config.aggregateFunction = oldAggregateFunction
      this.config.groupBy = oldGroupBy

      var reqUrl = this.url()

      // technically returns a $.Deferred but bluebird throws a warning when
      // returning a promise from within DataTables .ajax
      return $.ajax({
        dataType: "json",
        url: reqUrl,
        data: data,
        method: "POST"
      }).then(function (response) {
        self.recordCount = response.rows.length ? response.rows[0].value : 0
        return self.recordCount
      })
    }
  },
  getFields: function () {
    var fields = this.fieldsCache[this.config.dataset]
    // TODO: Is there a better way to detect whether it's been fetched?
    //  (technically it could just have a 0 length after being fetched)
    if (fields.length) {
      return Promise.resolve(fields)
    } else {
      return new Promise(function (resolve, reject) {
        fields.fetch({
          success: resolve,
          error: reject
        })
      })
    }
  }
})
