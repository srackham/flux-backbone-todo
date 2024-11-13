/**
 * server.js is the default script run by npm start command.
 * Based on https://gist.github.com/rpflorence/701407
 * See also http://book.mixu.net/node/ch10.html
 *
 * CLI: node server.js [directory [port]]
 */

/* eslint-env node */

'use strict'

var http = require('http')
var url = require('url')
var path = require('path')
var fs = require('fs')

function createServer(baseDir) {
  if (path.resolve(baseDir) !== path.normalize(baseDir)) {
    // If not an absolute directory name then convert to absolute (path.isAbsolute() is in >0.11).
    baseDir = path.join(__dirname, baseDir)
  }
  return http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname
    if (path.normalize(decodeURI(uri)) !== decodeURI(uri)) {
        response.statusCode = 403;
        response.end();
        return;
    }
    var filename = path.join(baseDir, uri)

    fs.exists(filename, function(exists) {
      if (!exists) {
        response.writeHead(404, {'Content-Type': 'text/plain'})
        response.write('404 Not Found\n')
        response.end()
        return
      }
      if (fs.statSync(filename).isDirectory()) {
        filename += '/index.html'
      }
      fs.readFile(filename, 'binary', function(err, file) {
        if (err) {
          response.writeHead(500, {'Content-Type': 'text/plain'})
          response.write(err + '\n')
          response.end()
          return
        }
        response.writeHead(200)
        response.write(file, 'binary')
        response.end()
      })
    })
  })
}

if (module.parent) {
  // Required as module.
  module.exports = createServer
}
else {
  // Run from command-line.
  var baseDirectory = process.argv[2] || './build'
  var port = process.argv[3] || 8888

  var server = createServer(baseDirectory)
  server.listen(parseInt(port, 10))

  console.log('Server URL: http://localhost:' + port + '/\nServed directory: ' + baseDirectory + '\nCTRL + C to shutdown')
}

