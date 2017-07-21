import {test} from 'ava';
import {StoreManager} from "../../src/store/Store";

test('creates store', (t) => {
    t.true(StoreManager.createStore({})!=undefined);
});

test('store change any action value', (t) => {
    let initState = { name : "1", count:0};
    let store = StoreManager.createStore(initState);
    store.action().subscribe((s:any,a:any)=> { let ns:any = Object.assign({},s);
        ns.name = a.name; ns.count++; return ns; } );
    let state:any = null;
    store.observable().subscribe(s=>state = s);
    t.true(state == initState);
    store.dispatch({name:"test"});
    t.false(state == initState);
    t.is(state.name, "test");
    t.is(state.count, 1);

});

