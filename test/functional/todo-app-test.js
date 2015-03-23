/* eslint-env node */
/* eslint-env mocha */

'use strict'

process.env.NODE_ENV = 'test'

var createServer = require('../../bin/server.js')
var Browser = require('zombie')
var assert = require('assert')

describe('todo app', function() {

  before(function() {
    this.server = createServer('../build/').listen(3000)
    this.browser = new Browser({ site: 'http://localhost:3000' })
  })

  // Load todo app.
  before(function(done) {
    this.browser.visit('/index.html', done)
  })

  it('should show page title', function() {
    assert.ok(this.browser.success)
    assert.equal(this.browser.text('h3'), 'Todos')
  })

  after(function(done) {
    this.server.close(done)
  })

})
