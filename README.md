[![Build Status](https://travis-ci.org/binig/gringotts.svg?branch=master)](https://travis-ci.org/binig/gringotts)
[![codecov](https://codecov.io/gh/binig/gringotts/branch/master/graph/badge.svg)](https://codecov.io/gh/binig/gringotts)
[![Dependency Status](https://gemnasium.com/badges/github.com/binig/gringotts.svg)](https://gemnasium.com/github.com/binig/gringotts)

## Basic Usage
1) Create a store and bind a reducer to event
```js
let store = StoreManager.createStore({ name : 'gringotts', counter : 0 });
store.action().subscribe((s,a)=> { let ns = Object.assign({},s);
            ns.name = a.name; ns.count++; return ns; } );

```
2) To get the state update we subscribe to the state Observable
```js
store.observable().subscribe(s=>console.log(s));
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
let store = StoreManager.createStore({ name : 'gringotts', counter : 0 });
let nameStore = store.mapPath('name');
let countStore = store.mapPath('counter');

// here the subscribe is done on a store that has for state directly the name
// so we just for reducer return the new name
// of course we filter out action that do not provide a new name
nameStore.action().filter(a=>a.name!==null).subscribe((s,a)=> a.name);

// he we just want to count all the action
// the state contains directly the count value
countStore.action().subscribe((s,a)=> s+1);

```
2) To get the state update we subscribe to the state Observable
```js
store.observable().subscribe(s=>console.log(s));
// be we can also subscribe to the substore
nameStore.observable().subscribe(s=>console.log('nameStore', s));
countStore.observable().subscribe(s=>console.log('countStore', s));
```
3) We trigger an event
```js
store.dispatch({ name : null});
store.dispatch({ name : 'newname'});
```

## To Sum it up !
* with the sub store we can modularized and even simplify our reducer ( they can directly return the name ).
* we avoid big switches on action type with filters to decide what to do with the event.
* we can even reuse reducer on multiple substore.
* we can take advantage of the Observable transformation function to bind Recuder with the Store.subscribeReducer(observable, reducer)


## License

The MIT License (MIT) - See file 'LICENSE' in this project

## Copyright

Copyright © 2017 Benoît Roger. All Rights Reserved.
