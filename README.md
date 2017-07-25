[![Build Status](https://travis-ci.org/binig/stoRx.svg?branch=master)](https://travis-ci.org/binig/stoRx)
[![codecov](https://codecov.io/gh/binig/stoRx/branch/master/graph/badge.svg)](https://codecov.io/gh/binig/stoRx)
[![Dependency Status](https://gemnasium.com/badges/github.com/binig/stoRx.svg)](https://gemnasium.com/github.com/binig/stoRx)
[![npm](https://img.shields.io/npm/v/storx.svg)](https://www.npmjs.com/package/storx)
[![npm](https://img.shields.io/npm/dm/storx.svg)](https://www.npmjs.com/package/storx)


## Basic Usage
1) Create a store and bind a reducer to event
```js
let store = StoreManager.createStore({ name : 'stoRx', counter : 0 });
store.action().subscribe((state, action)=> { let newState = ...state;
            newState.name = action.name; newState.count++; return newState; } );

```
2) To get the state update we subscribe to the state Observable
```js
store.observable().subscribe(state=>console.log(state));
```

3) We trigger an event
```js
store.dispatch({ name : 'newname'});
```

## Using Substore
with the previous example it's just look like a lame redux / rxjs, so we gonna deep further with the same example but using
map and filter
1) Create a store and a substore pointing to the name  and one to the counter
```js
let store = StoreManager.createStore({ name : 'stoRx', counter : 0 });
let nameStore = store.map('name');
let countStore = store.map('counter');

// here the subscribe is done on a store that has for state directly the name
// so we just for reducer return the new name
// of course we filter out action that do not provide a new name
nameStore.action().filter(action=>action.name!==null).subscribe((state,action)=> action.name);

// he we just want to count all the action
// the state contains directly the count value
countStore.action().subscribe((state,action)=> state+1);

```
2) To get the state update we subscribe to the state Observable
```js
store.observable().subscribe(state=>console.log(state));
// be we can also subscribe to the substore
nameStore.observable().subscribe(nameState=>console.log('nameStore', nameState));
countStore.observable().subscribe(countState=>console.log('countStore', countState));
```
3) We trigger an event
```js
store.dispatch({ name : null});
store.dispatch({ name : 'newname'});
```
## Binding directly to event
we can use the dispatch like redux, but we can also directly bind to any javascript event
```js
let el = document.getElementById('MyButton');
countStore.subscribe(Observable.fromEvent(el,'click'), (state,actionEvent)=>state+1);
```
we can have reducer on any Observable.

## To Sum it up !
* with the sub store we can modularized and even simplify our reducer ( they can directly return the name ).
* we avoid big _switch_ on action type with filters to decide what to do with the event.
* we can even reuse reducer on multiple substore.
* we can take advantage of the Observable transformation function to bind Recuder with the Store.subscribeReducer(observable, reducer)

## TODOS 
* Add time machine feature
* Should store.map('path') return the same instance of the same path (if not they should behave like they are) ? add cache of substore ?

## License

The MIT License (MIT) - See file 'LICENSE' in this project

## Copyright

Copyright © 2017 Benoît Roger. All Rights Reserved.
