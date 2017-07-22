import { expect } from 'chai';
import {Reducer, Store, StoreManager} from "../../src/store/Store";
import {isUndefined} from "util";

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
    it('subStore reducer does nothing', () => {
        let initState = { name : "1", count:0};
        let store = StoreManager.createStore(initState);
        let substore = store.mapPath('name');
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

    it('store change any action value subStore by map function', () => {
        let initState:State = { name : "1", count:0};
        let store:Store<State> = StoreManager.createStore(initState);
        let substore:Store<string> = store.map((s:State)=>s.name, (s:string,p:State)=>{p.name=s; return p});
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
        let substore = store.mapPath('parent.name');
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
        let substore = store.mapPath('parent').mapPath('name');
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

    it('store change any action value subStore of substore by map function', () => {
        let initState = {parent:{ name : "1"}};
        let store = StoreManager.createStore(initState);
        let substore = store.map((s:any)=>s.parent, (s:any, p:any)=> {p.parent=s; return p;})
            .map((s:any)=>s.name, (s:any, p:any)=> {p.name=s; return p;});
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
        let substore:Store<string> = store.mapPath('name');
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
        let substore:Store<string> = store.mapPath('name');
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
        let substore:Store<string> = store.mapPath('name');
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

});