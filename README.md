# Flux Backbone Todos Example

- **Published**: Version 1.1.0 (30 November 2014), persist Todos to LocalStorage.
- **Published**: Version 1.0.0 (14 November 2014).

This didactic Todo app was written to illustrate the
[Flux](http://facebook.github.io/react/blog/2014/05/06/flux.html) DSV
(Dispatch Store View) design pattern.

Flux is a design pattern for building scaleable applications using a
Unidirectional Data Flow (it is not a Web development framework), the
Flux library implements a
[Dispatcher](http://facebook.github.io/flux/docs/dispatcher.html).
which works well with the Flux design pattern.

The Todo app is implemented using
[Flux](http://facebook.github.io/react/blog/2014/05/06/flux.html),
[Backbone](http://backbonejs.org/) and
[React](http://facebook.github.io/react/index.html).


## Architecture and Implementation
The Flux/React combination results in a highly decoupled declarative
application structure. Here is the actual code:

    var dispatcher = new Flux.Dispatcher();
    var todoStore = new TodoStore([], {dispatcher: dispatcher});

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

Just declare the Dispatcher, Store and View and you're done. The
Flux unidirectional _Dispatcher->Store->View_ dependencies are
obvious.

- The `todoStore` is passed the `dispatcher` (as a constructor
  argument) when it is instantiated.

- UI components that display or update the Todo list are passed the
  `todoStore` (as a property) when they are instantiated.

Displaying a second fully synchronized Todo list is a bit nonsensical
but it graphically illustrates the power of the Flux architecture --
try doing this in any other framework.


## Data flow
Data flows unidirectionally in a circular path
_Dispatcher->Store->View->Dispatcher-> ..._:

- The `todoStore` listens for `dispatcher` actions (messages) and updates
  itself in response to these messages.

- UI components listen for Backbone events from the `todoStore`
  informing them of changes to the store that need to be displayed in
  the UI.

- UI components send actions (messages) to the `dispatcher` in
  response to user input -- components do not mutate the store
  directly.


## The Store
- The store is a Black Box containing the application's state and the
  logic to execute dispatcher actions which update (mutate) the store.
- Externally there is no way to mutate the store other than indirectly
  via dispatcher actions.
- The store emits change events to subscribers (UI view components).
- The store has no knowledge of its external environment.

Backbone is used to implement a pub/sub data store for the Todos list
with Backbone Models and Collections (Backbone is not used as a
development framework). Backbone unburdens the app from having to
implement a pub/sub event emitter for the store (as well as providing
a rich model/collection API).

Storing the component state in a mutative Backbone store instead of
using an immutable component `State` object means we need to use the
React
[forceUpdate](http://facebook.github.io/react/docs/component-api.html#forceupdate)
API which could have performance implications for complex React UIs.
See this [excellent
discussion](http://stackoverflow.com/questions/21709905/can-i-avoid-forceupdate-when-using-react-with-backbone)
explains the issue and, if necessary, strategies to resolve it.  React
does a great job of DOM update optimization so I would stick with the
simplicity of using `forceUpdate` until confronted with a real
use-case to the contrary.

`TodoStore` collection and `TodoItem` models are passed a Flux
dispatcher when they are instantiated. `TodoItem` models are
instantiated by the Backbone Collection `add` method which passes the
dispatcher option to the `TodoItem` model's `initialize` function.


## Building and Running
The app is developed and built in a node/npm environment. To install
and run:

1. Make sure you have node and npm installed.

2. Clone the Github repo:

        git clone https://github.com/srackham/flux-backbone-todo.git

3. Install npm dependencies:

        cd flux-backbone-todo
        npm install

4. Build the app `app/bundle.js` bundle (although JQuery is not
  required by Backbone I had to include it to satisfy webpack which
  thought it was a dependency):

        webpack

5. Start the app in a server:

        npm start

6. Open your Web browser at <http://localhost:8888/>.


## Lessons learnt
- As always in JavaScript, when you pass a callback you need to ensure
  that they are bound to the correct context. In the following example
  the Backbone Model event handler's context is bound to the current
  object:

        this.props.store.on('change',
            function() {
              this.forceUpdate();
            }.bind(this)
        );

- When binding you need to take caller and callee arguments into
  consideration. The previous example can be simplified by passing
  `forceUpdate` as the change handler callback, but if you do not
  remember to explicitly bind the `forceUpdate` first argument to
  `null` the program will throw an error because `forceUpdate` would
  be called by the Backbone event dispatcher with a first argument
  that is not a callback (namely the changed Backbone model):

        this.props.store.on('change',
          this.forceUpdate.bind(this, null)
        );

- Backbone Model attributes are not model properties -- access them
  with `get()` and `set()` not with the dot syntax.

- I spent far to much time debugging what is a very simple
  application, most of the time could have been saved if I had been
  using a language with type checking -- _ES6 + JSX + type
  annotations + type checking_  would be nice (this is a criticism of
  JavaScript in general, not of the application architecture or the
  tools).

