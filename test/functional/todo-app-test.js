/* eslint-env node */
/* eslint-env mocha */

'use strict'

process.env.NODE_ENV = 'test'


var createServer = require('../../bin/server.js')
var Browser = require('zombie')
// Browser.debug = true
Browser.silent = true

describe('todo app', function() {

  var LIST1 = '#list1'
  var LIST2 = '#list2'
  var LIST1_LAST_SPAN = LIST1 + ' li:last-child span'
  var LIST2_LAST_SPAN = LIST2 + ' li:last-child span'

  before(function() {
    this.server = createServer('../build/').listen(3000)
    this.browser = new Browser({site: 'http://localhost:3000'})
  })

  describe('visit home page', function() {
    before(function(done) {
      this.browser.visit('/', done)
    })

    it('should be successful', function() {
      this.browser.assert.success()
    })
    it('should display page heading', function() {
      this.browser.assert.text('h3', 'Todos')
    })
  })

  describe('adding a new todo', function() {

    var before_list_length

    before(function(done) {
      before_list_length = this.browser.queryAll(LIST1 + ' li').length
      this.browser
        .fill('form input[type=text]', 'new todo')
        .pressButton('Add Todo', done)
    })

    it('should be successful', function() {
      this.browser.assert.success()
    })

    it('should add one todo', function() {
      this.browser.assert.elements(LIST1, before_list_length + 1)
      this.browser.assert.elements(LIST2, before_list_length + 1)
    })

    it('should append the new todo to the end of the list', function() {
      this.browser.assert.text(LIST1_LAST_SPAN, 'new todo')
      this.browser.assert.text(LIST2_LAST_SPAN, 'new todo')
    })

    it('should style the todo with normal text', function() {
      this.browser.assert.style(LIST1_LAST_SPAN, 'text-decoration', '')
      this.browser.assert.style(LIST2_LAST_SPAN, 'text-decoration', '')
    })

  })

  // Click the todo item 3 times and check the style toggles.
  var completed_values = [false, true, false]
  completed_values.forEach(function(completed) {
    describe('clicking on a ' + (completed ? 'done' : 'pending') + ' todo', function() {

      before(function(done) {
        this.browser.fire(LIST1_LAST_SPAN, 'click', done)
      })

      it('should be successful', function() {
        this.browser.assert.success()
      })

      it('should strike-through the todo text', function() {
        var expected_style = completed ? '' : 'line-through'
        this.browser.assert.style(LIST1_LAST_SPAN, 'text-decoration', expected_style)
        this.browser.assert.style(LIST2_LAST_SPAN, 'text-decoration', expected_style)
      })

    })
  })

  describe('clearing completed todos', function() {

    var before_list_length

    before(function(done) {
      before_list_length = this.browser.queryAll(LIST1 + ' li').length
      this.browser.pressButton('Clear Completed', done)
    })

    it('should be successful', function() {
      this.browser.assert.success()
    })

    it('should remove one todo', function() {
      this.browser.assert.elements(LIST1, before_list_length - 1)
      this.browser.assert.elements(LIST2, before_list_length - 1)
    })

  })

  after(function(done) {
    this.server.close(done)
  })

})
