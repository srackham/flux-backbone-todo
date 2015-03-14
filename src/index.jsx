/*
 Simple Todo app written using Flux, Backbone and React.
 https://github.com/srackham/flux-backbone-todo
 */
'use strict';

// eslint exceptions
/* global TodoFormComponent, TodoListComponent */
/* global React, Flux, Backbone, getLocalStorageSync */

import React from 'react';
import Flux from 'flux';
import Backbone from 'backbone';
import getLocalStorageSync from 'backbone-localstorage-sync';

/*
 Dispatcher actions.
 */
const ADD_TODO = 'ADD_TODO';
const TOGGLE_TODO = 'TOGGLE_TODO';
const CLEAR_TODOS = 'CLEAR_TODOS';

/*
 Todo item model.
 */
let TodoItem = Backbone.Model.extend({
  defaults: {text: '', complete: false},
  sync: getLocalStorageSync('flux-backbone-todo'),

  initialize(attributes, options) { // eslint-disable-line no-unused-vars
    this.dispatcher = TodoItem.dispatcher;
  }

});

/*
 Todo collection store.
 */
let TodoStore = Backbone.Collection.extend({
  model: TodoItem,
  sync: getLocalStorageSync('flux-backbone-todo'),

  initialize(models, options) {
    this.dispatcher = options.dispatcher;
    this.model.dispatcher = this.dispatcher;
    this.dispatchId = this.dispatcher.register(this.dispatchCallback.bind(this));
    this.on('sync', (model, resp) => console.log('SUCCESS: sync response:', resp));
    this.on('error', (model, resp) => console.log('ERROR: sync error:', resp));
    this.fetch(); // Load models from localStorage.
  },

  dispatchCallback(payload) {
    switch (payload.action) {
      case ADD_TODO:
        this.create({text: payload.text});
        break;
      case TOGGLE_TODO:
        payload.todoItem.save('complete', !payload.todoItem.get('complete'));
        break;
      case CLEAR_TODOS:
        let completed = this.filter(todoItem => todoItem.get('complete'));
        completed.forEach(todoItem => todoItem.destroy());
        break;
    }
  }

});

/*
 Todo form.
 */
class TodoFormComponent extends React.Component {
  static propTypes = {
    store: React.PropTypes.instanceOf(TodoStore)
  };

  handleAddTodo(event) {
    event.preventDefault();
    let text = this.refs.text.getDOMNode();
    if (text.value.length > 0) {
      this.props.store.dispatcher.dispatch({action: ADD_TODO, text: text.value});
      text.value = '';
    }
  }

  handleClearTodos() {
    this.props.store.dispatcher.dispatch({action: CLEAR_TODOS});
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleAddTodo.bind(this)}>
          <input ref='text' type='text' placeholder='New Todo' autofocus='true' />
          <input type='submit' value='Add Todo' />
        </form>
        <button onClick={this.handleClearTodos.bind(this)}>Clear Completed</button>
      </div>
    );
  }
}

/*
 Todo list component.
 */
class TodoListComponent extends React.Component {
  static propTypes = {
    store: React.PropTypes.instanceOf(TodoStore).isRequired
  };

  componentDidMount() {
    this.props.store.on('add remove reset',
      this.forceUpdate.bind(this, null)
    );
  }

  componentWillUnmount() {
    this.props.store.off(null, null, this);
  }

  render() {
    let items = this.props.store.map(todoItem =>
        <li key={todoItem.cid}>
          <TodoItemComponent todoItem={todoItem} />
        </li>
    );
    return <ul>{items}</ul>;
  }
}

/*
 Todo item component.
 */
class TodoItemComponent extends React.Component {
  static propTypes = {
    todoItem: React.PropTypes.instanceOf(TodoItem).isRequired
  };

  componentDidMount() {
    this.props.todoItem.on('change',
      this.forceUpdate.bind(this, null)
    );
  }

  componentWillUnmount() {
    this.props.todoItem.off(null, null, this);
  }

  handleToggleTodo() {
    this.props.todoItem.dispatcher.dispatch({action: TOGGLE_TODO, todoItem: this.props.todoItem});
  }

  render() {
    let complete = this.props.todoItem.get('complete');
    let style = {cursor: 'pointer', textDecoration: complete ? 'line-through' : ''};
    return (
      <span style={style} onClick={this.handleToggleTodo.bind(this)}>
          {this.props.todoItem.get('text')}
      </span>
    );
  }
}


/*
 Instantiate Todo application.
 */
let dispatcher = new Flux.Dispatcher();
let todoStore = new TodoStore(null, {dispatcher: dispatcher});

React.render(
  <div>
    <h3>Todos</h3>
    <TodoFormComponent store={todoStore} />
    <TodoListComponent store={todoStore} />
    <p>
      Want a second fully synchronized list? Just declare another list component: no code required,
      no events to wire up!
    </p>
    <TodoListComponent store={todoStore} />
  </div>,
  document.getElementById('app')
);
