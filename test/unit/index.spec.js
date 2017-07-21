"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const Store_1 = require("../../src/store/Store");
ava_1.test('creates store', (t) => {
    t.true(Store_1.StoreManager.createStore({}) != undefined);
});
ava_1.test('store change any action value', (t) => {
    let initState = { name: "1", count: 0 };
    let store = Store_1.StoreManager.createStore(initState);
    store.action().subscribe((s, a) => { s.name = a.name; s.count++; return s; });
    let state = null;
    store.observable().subscribe(s => state = s);
    t.true(state == initState);
    store.dispatch({ name: "test" });
    t.false(state == initState);
    t.is(state.name, "test");
    t.is(state.count, 1);
});
