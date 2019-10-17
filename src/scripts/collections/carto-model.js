var Backbone = require('backbone')

module.exports = Backbone.Model.extend({
  idAttribute: 'label',
  // Fetch the model from the server, merging the response with the model's
  // local attributes. Any changed attributes will trigger a "change" event.
  fetch: function(options) {
    options = _.extend({parse: true}, options);
    var model = this;
    var success = options.success;
    options.success = function(resp) {
      var serverAttrs = options.parse ? model.parse(resp, options) : resp;
      if (!model.set(serverAttrs, options)) return false;
      if (success) success.call(options.context, model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);
    console.log('carto model options:', options)
    return this.sync('create', this, options);
  },
})