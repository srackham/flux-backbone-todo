/*
 Simple Todo app written using Flux, Backbone and React.
 https://github.com/srackham/flux-backbone-todo
 */

var React = require('react');
var Flux = require('flux');
var Backbone = require('backbone');
var LocalStorage = require('./localstorage.js');

/*
 Dispatcher actions.
 */
var ADD_TODO = 'ADD_TODO';
var TOGGLE_TODO = 'TOGGLE_TODO';
var CLEAR_TODOS = 'CLEAR_TODOS';

/*
 Todo item model.
 */
var TodoItem = Backbone.Model.extend({
  defaults: {text: '', complete: false},

  initialize: function(attributes, options) {
    this.dispatcher = options.dispatcher;
  }

});

/*
 Todo collection store.
 */
var TodoStore = Backbone.Collection.extend({
  model: TodoItem,
  localStorage: new LocalStorage('flux-backbone-todo'),

  initialize: function(models, options) {
    this.dispatcher = options.dispatcher;
    this.dispatchId = this.dispatcher.register(this.dispatchCallback.bind(this));
    this.on('sync', function(model, resp) {
      console.log('SUCCESS: sync response:', resp);
    });
    this.on('error', function(model, resp) {
      console.log('ERROR: sync error:', resp);
    });
    // Load models from localStorage and attach the dispatcher.
    this.fetch();
    this.forEach(function(todoItem) { todoItem.dispatcher = options.dispatcher; });
  },

  dispatchCallback: function(payload) {
    switch (payload.action) {
      case ADD_TODO:
        var todoItem = this.add({text: payload.text}, {dispatcher: this.dispatcher});
        todoItem.save();
        break;
      case TOGGLE_TODO:
        payload.todoItem.set('complete', !payload.todoItem.get('complete'));
        payload.todoItem.save();
        break;
      case CLEAR_TODOS:
        var completed = this.filter(function(todoItem) {
          return todoItem.get('complete');
        });
        // Destroy todoItem before removing from collection.
        // Because removed models have no collection property which is required by LocalStorage.
        completed.forEach(function(todoItem) { todoItem.destroy() });
        this.remove(completed);
        break;
    }
  }

});

/*
 Todo form.
 */
var TodoFormComponent = React.createClass({
  propTypes: {
    store: React.PropTypes.instanceOf(TodoStore)
  },

  handleAddTodo: function(event) {
    event.preventDefault();
    var text = this.refs.text.getDOMNode();
    if (text.value.length > 0) {
      this.props.store.dispatcher.dispatch({action: ADD_TODO, text: text.value});
      text.value = '';
    }
  },

  handleClearTodos: function() {
    this.props.store.dispatcher.dispatch({action: CLEAR_TODOS});
  },

  render: function() {
    return (
      <div>
        <form  onSubmit={this.handleAddTodo}>
          <input ref='text' type='text'  placeholder='New Todo' autofocus='true' />
          <input type='submit' value='Add Todo' />
        </form>
        <button onClick={this.handleClearTodos}>Clear Completed</button>
      </div>
    );
  }
});

/*
 Todo list component.
 */
var TodoListComponent = React.createClass({
  propTypes: {
    store: React.PropTypes.instanceOf(TodoStore).isRequired
  },

  componentDidMount: function() {
    this.props.store.on('add remove reset',
      this.forceUpdate.bind(this, null)
    );
  },

  componentWillUnmount: function() {
    this.props.store.off(null, null, this);
  },

  render: function() {
    var items = this.props.store.map(function(todoItem) {
      return (
        <li key={todoItem.cid}>
          <TodoItemComponent todoItem={todoItem} />
        </li>);
    });
    return <ul>{items}</ul>;
  }
});

/*
 Todo item component.
 */
var TodoItemComponent = React.createClass({
  propTypes: {
    todoItem: React.PropTypes.instanceOf(TodoItem).isRequired
  },

  componentDidMount: function() {
    this.props.todoItem.on('change',
      this.forceUpdate.bind(this, null)
    );
  },

  componentWillUnmount: function() {
    this.props.todoItem.off(null, null, this);
  },

  handleToggleTodo: function() {
    this.props.todoItem.dispatcher.dispatch({action: TOGGLE_TODO, todoItem: this.props.todoItem});
  },

  render: function() {
    var complete = this.props.todoItem.get('complete');
    var style = {cursor: 'pointer', textDecoration: complete ? 'line-through' : ''};
    return (
      <span style={style} onClick={this.handleToggleTodo}>
          {this.props.todoItem.get('text')}
      </span>
    );
  }

});

/*
 Instantiate Todo application.
 */
var dispatcher = new Flux.Dispatcher();
var todoStore = new TodoStore(null, {dispatcher: dispatcher});

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
