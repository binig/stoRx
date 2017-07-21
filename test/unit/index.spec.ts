import { expect } from 'chai';
import {StoreManager} from "../../src/store/Store";
describe("Store test",()=>{
    it('creates store', () => {
        expect(StoreManager.createStore({})).to.be.any;
    });

    it('store change any action value', () => {
        let initState = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        store.action().subscribe((s:any,a:any)=> { let ns:any = Object.assign({},s);
            ns.name = a.name; ns.count++; return ns; } );
        let state:any = null;
        store.observable().subscribe(s=>state = s);
        expect(state).to.be.eq(initState);
        store.dispatch({name:"test"});
        expect(state).to.not.eq(initState);
        expect(state.name).to.be.eq("test");
        expect(state.count).to.be.eq(1);
    });

    it('store change any action value subStore', () => {
        let initState = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore = store.mapPath('name');
        substore.action().subscribe((s:any,a:any)=> { return a.name} );
        let state:any = null;
        let substate:any = null;
        store.observable().subscribe(s=>state = s);
        substore.observable().subscribe(s=>substate = s);
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch({name:"test"});
        expect(substate).to.be.eq('test',"name in substate should be change by dispatch action");
        expect(state).to.be.not.eq(initState, "the state should be a new one s");
        expect(state.name).to.be.eq( "test", "name should be change by dispatch action");

    });

});