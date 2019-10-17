var $ = require('jquery')
var deparam = require('node-jquery-deparam')
var Gist = require('./collections/gist')
var layout = require('./layout')
var introJs = require('intro.js')

var params = window.location.search.substr(1) ? deparam(window.location.search.substr(1)) : {}
var pathToFiles = 'data/' // should include trailing slash

var layoutOptions = {
  headerSelector: '#page-header',
  contentSelector: '#page-content'
}


$.getJSON('data/rcos.json', function (data) {
  layout(data, layoutOptions)
  console.log('intro starting')
  // if (window.localStorage.getItem('intro_shown')) {
  //   console.log('already shown')
  //   return
  // }
  // window.localStorage.setItem('intro_shown', true)

  var intro = introJs();
  intro.setOptions({
    steps: [
      {
        intro: "Find your RCO to get started"
      },
      {
        element: 'div.rcoselect',
        intro: "Click on a row in the 'Filter properties by RCO' table, or enter your RCO name to search the list.",
        position: "top"
      },
      {
        element: 'div.pie',
        intro: 'You can also click a slice of pie to filter by category or homestead exemption',
        position: 'left'
      },
      {
        element: 'div.bar',
        intro: "Or click on a bar chart to filter by zoning or building description.",
        position: 'bottom'
      },
      {
        element: 'a.intro',
        intro: 'Click "How to use" to show this intro again'
      }
    ]
  });
  intro.start();

}).fail(function () {
  console.error('Error loading file', params.file)
})
