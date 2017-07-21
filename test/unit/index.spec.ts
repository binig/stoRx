import {test} from 'ava';
import {StoreManager} from "../../src/store/Store";

test('creates store', (t) => {
    t.true(StoreManager.createStore({})!=undefined);
});
