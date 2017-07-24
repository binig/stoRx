import { expect } from 'chai';
import {StoRx} from "../../src/store/Store";
import {isUndefined} from "util";
import Reducer = StoRx.Reducer;
import StoreManager = StoRx.StoreManager;
import Store = StoRx.Store;

interface State {
    name:string;
    count:number;
}

class EventName {

    constructor(public name?:string) {
    }
}

class StateNameReducer implements Reducer<State,EventName> {

    reduce(state: State, a: EventName): State {
        let n:State = Object.assign({}, state);
        n.name = a.name;
        n.count++;
        return n;
    }
}

class NameReducer implements Reducer<string,EventName> {

    reduce(state: string, a: EventName): string {
        return a.name;
    }
}


describe("Store test",()=>{
    it('creates store', () => {
        expect(StoreManager.createStore({})).to.be.any;
    });

    it('store change any action value using function', () => {
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

    it('store change any action value using reducer', () => {
        let initState:State = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        store.actionByType(EventName).subscribeReducer(new StateNameReducer());
        let state:any = null;
        store.observable().subscribe(s=>state = s);
        expect(state).to.be.eq(initState);
        store.dispatch(new EventName("test"));
        expect(state).to.not.eq(initState);
        expect(state.name).to.be.eq("test");
        expect(state.count).to.be.eq(1);
    });

    it('store change any action value subStore', () => {
        let initState = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore = store.map('name');
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
    it('subStore reducer does nothing', () => {
        let initState = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore = store.map('name');
        substore.action().subscribe((s:any,a:any)=> { return s} );
        let state:any = null;
        let substate:any = null;
        store.observable().subscribe(s=>state = s);
        substore.observable().subscribe(s=>substate = s);
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch({name:"test"});
        expect(substate).to.be.eq('1',"name should be the same");
        expect(state).to.be.eq(initState, "the state should still be the same");
        expect(state.name).to.be.eq( "1", "name should notbe change by dispatch action");

    });

    it('store change any action value subStore by mapFunction function', () => {
        let initState:State = { name : "1", count:0};
        let store:Store<State> = StoreManager.createStore(initState);
        let substore:Store<string> = store.mapFunction((s:State)=>s.name, (s:string, p:State)=>{p.name=s; return p});
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

    it('store change any action value subStore deep', () => {
        let initState = {parent:{ name : "1"}};
        let store = StoreManager.createStore(initState);
        let substore = store.map('parent.name');
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
        expect(state.parent.name).to.be.eq( "test", "name should be change by dispatch action");

    });

    it('store change any action value subStore of substore', () => {
        let initState = {parent:{ name : "1"}};
        let store = StoreManager.createStore(initState);
        let substore = store.map('parent').map('name');
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
        expect(state.parent.name).to.be.eq( "test", "name should be change by dispatch action");

    });

    it('store change any action value subStore of substore by mapFunction function', () => {
        let initState = {parent:{ name : "1"}};
        let store = StoreManager.createStore(initState);
        let substore = store.mapFunction((s:any)=>s.parent, (s:any, p:any)=> {p.parent=s; return p;})
            .mapFunction((s:any)=>s.name, (s:any, p:any)=> {p.name=s; return p;});
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
        expect(state.parent.name).to.be.eq( "test", "name should be change by dispatch action");

    });

    it('store change any action value subStore using reducer', () => {
        let initState:State = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore:Store<string> = store.map('name');
        substore.actionByType(EventName).subscribeReducer(new NameReducer());
        let state:State = null;
        let substate:string = null;
        store.observable().subscribe(s=>state = s);
        substore.observable().subscribe(s=>substate = s);
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName("test"));
        expect(substate).to.be.eq('test',"name in substate should be change by dispatch action");
        expect(state).to.be.not.eq(initState, "the state should be a new one s");
        expect(state.name).to.be.eq( "test", "name should be change by dispatch action");

    });

    it('store change filtered action value subStore using function', () => {
        let initState:State = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore:Store<string> = store.map('name');
        substore.actionByType(EventName)
            .filter(e=>e.name!=='ignore')
            .filter(e=>e.name!==null)
            .subscribe((s,e)=>e.name);
        let state:State = null;
        let substate:string = null;
        store.observable().subscribe(s=>state = s);
        substore.observable().subscribe(s=>substate = s);
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName(null));
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName("ignore"));
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName("test"));
        expect(substate).to.be.eq('test',"name in substate should be change by dispatch action");
        expect(state).to.be.not.eq(initState, "the state should be a new one s");
        expect(state.name).to.be.eq( "test", "name should be change by dispatch action");

    });

    it('store change filtered action value subStore using reducer', () => {
        let initState:State = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore:Store<string> = store.map('name');
        substore.actionByType(EventName)
            .filter(e=>e.name!=='ignore')
            .filter(e=>e.name!==null)
            .subscribeReducer(new NameReducer());
        let state:State = null;
        let substate:string = null;
        store.observable().subscribe(s=>state = s);
        substore.observable().subscribe(s=>substate = s);
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName(null));
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName("ignore"));
        expect(state).to.be.eq(initState);
        expect(substate).to.be.eq('1');
        substore.dispatch(new EventName("test"));
        expect(substate).to.be.eq('test',"name in substate should be change by dispatch action");
        expect(state).to.be.not.eq(initState, "the state should be a new one s");
        expect(state.name).to.be.eq( "test", "name should be change by dispatch action");

    });

    it('change in a substore should not trigger distinct substore', () => {
        let initState = { name : 0, count:0};
        let store = StoreManager.createStore(initState);
        let countStore = store.map("count");
        let nameStore = store.map("name");
        let countStoreUpdate = 0;
        let storeUpdate = 0;
        let nameUpdate = 0;
        store.observable().subscribe(s=>storeUpdate +=1);
        countStore.observable().subscribe(s=>countStoreUpdate+=1);
        nameStore.observable().subscribe(s=>nameUpdate+=1);
        countStore.action().subscribe((s:number,a:any)=>s+1);
        nameStore.action().subscribe((s:number,a:any)=>s+1);
        nameStore.dispatch({});
        expect(countStoreUpdate).to.be.eq(1);
        expect(storeUpdate).to.be.eq(2);
        expect(nameUpdate).to.be.eq(2);
        countStore.dispatch({});
        expect(countStoreUpdate).to.be.eq(2);
        expect(storeUpdate).to.be.eq(3);
        expect(nameUpdate).to.be.eq(2);
        countStore.dispatch({});
        expect(countStoreUpdate).to.be.eq(3);
        expect(storeUpdate).to.be.eq(4);
        expect(nameUpdate).to.be.eq(2);

    });

});