// A simple CommonJS module to replace Backbone.sync` with browser localStorage.
//
// NOTE: Because localStorage requests execute synchronously the fetch, save and destroy
// APIs are also synchronous.
//
// https://github.com/addyosmani/backbone-fundamentals/blob/gh-pages/practicals/modular-todo-app/js/libs/backbone/localstorage.js
//
// Stuart Rackham: November 2014:
// Converted to a node compatible module for use by Browserify/Webpack; comments and refactoring.
//

'use strict';

var Backbone = require('backbone');
var _ = require('backbone/node_modules/underscore');

// Constructor function for creating Backbone sync adaptor objects.
var LocalStorage = function(name) {
  this.name = name;
  var json = window.localStorage.getItem(this.name);
  // data is keyed by model model id and contains model attribute hashes.
  this.data = (json && JSON.parse(json)) || {};
};
module.exports = LocalStorage;

// Mixin LocalStorage methods.
_.extend(LocalStorage.prototype, {

  saveData: function() {
    window.localStorage.setItem(this.name, JSON.stringify(this.data));
  },

  create: function(model) {
    if (!model.id) {
      model.id = model.attributes.id = guid();
    }
    return this.update(model);
  },

  update: function(model) {
    this.data[model.id] = model.toJSON();
    this.saveData();
    return model.toJSON();
  },

  find: function(model) {
    return this.data[model.id];
  },

  findAll: function() {
    // Return array of all models attribute hashes.
    return _.values(this.data);
  },

  destroy: function(model) {
    delete this.data[model.id];
    this.saveData();
    return model.toJSON();
  }

});

// Generate four random hex digits.
function s4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
  return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

/*
 Overrides Backbone.sync function.

 Called by Backbone Model fetch, save and destroy APIs (with the `model` argument set
 to the bound Model) and by the Collection fetch API (with the `model` argument set
 to the bound Collection).

 When processing a collection it's important that each model has a valid `collection` property.
 This will automatically be the case unless the model has been removed from or is not
 contained in a collection.

 Backbone exposes a success/error style callback interface to the fetch, save, and destroy APIs.
 This is to accommodate asynchronous client/server interactions e.g. using AJAX. But because
 all localStorage requests synchronously the fetch, save and destroy APIs behave synchronous.

 */
Backbone.sync = function(method, model, options) {
  console.log('sync', method, model);
  var localStorage = model.localStorage || model.collection.localStorage;
  var resp; // JSON response from the "server".
  switch (method) {
    case 'read':    // Model/Collection `fetch` APIs.
      resp = model.id ? localStorage.find(model) : localStorage.findAll();
      break;
    case 'create':  // Model `save` API.
      resp = localStorage.create(model);
      break;
    case 'update':  // Model `save` API.
      resp = localStorage.update(model);
      break;
    case 'delete':  // Model `destroy` API.
      resp = localStorage.destroy(model);
      break;
  }
  if (resp) {
    // 1. If necessary update the model/collection.
    // 2. Execute the fetch/save/destroy `options.success` callback.
    // 3. Emit a "sync" event with arguments model,resp,options.
    options.success(resp);
  } else {
    // 1. Execute the fetch/save/destroy `options.error` callback.
    // 2. Emit an "error" event with arguments model,resp,options.
    options.error(method);
  }
};
