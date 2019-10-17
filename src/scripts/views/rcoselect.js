var _ = require('underscore')
var Card = require('./card')
var Leaflet = require('leaflet')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
require('datatables')
require('datatables/media/js/dataTables.bootstrap')
require('bootstrap/js/tooltip')
// var wkx = require('wkx');

module.exports = Card.extend({
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)
    this.vent = options.vent || null

    // Listen to vent filters
    this.listenTo(this.vent, this.collection.getDataset() + '.filter', this.onFilter)

    // Loading indicators
    this.listenTo(this.collection, 'request', LoaderOn)
    this.listenTo(this.collection, 'sync', LoaderOff)

    _.bindAll(this, 'render')

    this.render()
  },
  render: function () {
    // If table is already initialized, clear it and add the collection to it

    if (this.table) {
      var initializedTable = this.$el.DataTable()
      initializedTable.clear()
      initializedTable.rows.add(this.collection.toJSON()).draw()
      // Otherwise, initialize the table
    } else {

      this.collection.getFields().then(_.bind(function (fieldsCollection) {
        // Initialize the table
        var container = this.$('.card-content table')
        this.table = container.DataTable({
          columns: [
            { data: "properties.ORGANIZATION_NAME" },
            { data: "properties.ORGANIZATION_ADDRESS"},
            { data: "properties.PRIMARY_NAME"},
            { data: "properties.PRIMARY_EMAIL"},
            { data: "properties.PRIMARY_PHONE"}
          ],
          order: [],
          scrollX: true,
          ajax: {
            url: '../../data/rco-boundaries.json',
            dataSrc: 'features'
          }
        })
        var dt = this.table
        var parentThis = this
        this.$('.card-content table tbody').on('click', 'tr', function(e) {
          var rowData = parentThis.table.row(this).data()

          // fetch boundaries geom from rowdata
          // set boundaries filter from geom
          // vent it

          // If already selected, clear the filter
          // console.log(this.filteredCollection.getTriggerField())
          var filter = parentThis.collection.getFilters('the_geom')
          if (filter && filter.expression.value === clickedId) {
            parentThis.vent.trigger('opa_properties_public.filter', {
              field: 'the_geom'
            })
            parentThis.vent.trigger('rcos.filter', {
              field: 'ORGANIZATION_NAME'
            })
            // Otherwise, add the filter
          } else {
            // Trigger the global event handler with this filter
            parentThis.vent.trigger('opa_properties_public.filter', {
              field: 'the_geom',
              expression: {
                type: 'complex',
                value: "ST_Within(the_geom, ST_GeomFromGeoJSON('" + JSON.stringify(rowData.geometry) + "')::geography::geometry)",
                label: rowData.properties.ORGANIZATION_NAME
              }
            })
            parentThis.vent.trigger('rcos.filter', {
              field: 'ORGANIZATION_NAME',
              expression: {
                type: '=',
                value: rowData.properties.ORGANIZATION_NAME,
                label: rowData.properties.ORGANIZATION_NAME
              }
            })

          }
        // }
      })
      }, this))
    }
  },
  // Adjust collection using table state, then pass off to collection.fetch with datatables callback
  dataTablesAjax: function (tableState, dataTablesCallback, dataTablesSettings) {

    this.collection.setSearch(tableState.search.value ? tableState.search.value : null)
    this.collection.unsetRecordCount()
    this.renderFilters()

    // Get record count first because it needs to be passed into the collection.fetch callback
    this.collection.getRecordCount().then(_.bind(function (recordCount) {

      if (!this.recordsTotal) {
        this.recordsTotal = recordCount
      }

      var recordsTotal = this.recordsTotal // for use in callback below

      this.collection.setOffset(tableState.start || 0)
      this.collection.setLimit(tableState.length || 25)

      if (tableState.order.length) {
        this.collection.setOrder(tableState.columns[tableState.order[0].column].data + ' ' + tableState.order[0].dir)
      }
      this.collection.fetch({
        error: function() {
          console.log('error loading RCO collection')
        },
        success: function (collection, response, options) {
          collection.models = collection.models.slice(collection.options.config.offset, collection.options.config.limit)
          dataTablesCallback({
            data: collection.toJSON(),
            recordsTotal: recordsTotal,
            recordsFiltered: recordCount
          })
        }
      })
    }, this))
  }
})
