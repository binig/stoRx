"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
class StoreManager {
    static createStore(state) {
        return new StoreImpl(state);
    }
}
exports.StoreManager = StoreManager;
class StoreUtils {
    static createMapFunction(path) {
        let pathSplit = path.split(".");
        return s => {
            let current = s;
            for (let el of pathSplit) {
                current = current[el];
            }
            return current;
        };
    }
    static createMapReverseFunction(path) {
        let pathSplit = path.split(".");
        return (s, p) => {
            let current = p;
            for (let i = 0; i < pathSplit.length - 1; i++) {
                current = current[pathSplit[i]];
            }
            s[pathSplit[pathSplit.length - 1]] = s;
            return p;
        };
    }
}
class StoreImpl {
    constructor(state) {
        this.state = state;
        this.stateSubject = new rxjs_1.ReplaySubject(1);
        this.actionSubject = new rxjs_1.Subject();
        this.updateState(state);
    }
    updateState(state) {
        this.currentState = state;
        this.stateSubject.next(state);
    }
    subscribeReducer(actions, reducer) {
        actions.subscribe(a => {
            let state = this.currentState;
            let newState = reducer.reduce(state, a);
            if (state != newState) {
                this.updateState(newState);
            }
        });
    }
    subscribe(actions, reducer) {
        this.subscribeReducer(actions, new ReducerFunction(reducer));
    }
    map(map, mapReverse) {
        return new ViewStore(map, mapReverse, this);
    }
    mapPath(path) {
        return new ViewStore(StoreUtils.createMapFunction(path), StoreUtils.createMapReverseFunction(path), this);
    }
    observable() {
        return this.stateSubject;
    }
    dispatch(action) {
        this.actionSubject.next(action);
    }
    action() {
        return new ActionManagerImpl(this, this.actionSubject);
    }
    actionByType(type) {
        return new ActionManagerImpl(this, this.actionSubject.filter(v => v instanceof type));
    }
}
class ActionManagerImpl {
    constructor(store, obs) {
        this.store = store;
        this.obs = obs;
    }
    subscribeReducer(reducer) {
        this.getStore().subscribeReducer(this.observable(), reducer);
    }
    subscribe(reducer) {
        this.getStore().subscribe(this.observable(), reducer);
    }
    observable() {
        return this.obs;
    }
    filter(filter) {
        return new FilterActionManager(this, filter);
    }
    getStore() {
        return this.store;
    }
}
class FilterActionManager {
    constructor(parent, filterFunction) {
        this.parent = parent;
        this.filterFunction = filterFunction;
    }
    subscribeReducer(reducer) {
        this.getStore().subscribeReducer(this.observable(), reducer);
    }
    subscribe(reducer) {
        this.getStore().subscribe(this.observable(), reducer);
    }
    observable() {
        return this.parent.observable().filter(this.filterFunction);
    }
    filter(filter) {
        return new FilterActionManager(this, filter);
    }
    getStore() {
        return this.parent.getStore();
    }
}
class ViewStore {
    constructor(mapFunction, mapReverseFunction, store) {
        this.mapFunction = mapFunction;
        this.mapReverseFunction = mapReverseFunction;
        this.store = store;
        this.actionSubject = new rxjs_1.Subject();
    }
    observable() {
        return this.store.observable().map(this.mapFunction);
    }
    dispatch(action) {
        this.store.dispatch(action);
        this.actionSubject.next(action);
    }
    action() {
        return new ActionManagerImpl(this, this.actionSubject);
    }
    actionByType(type) {
        return new ActionManagerImpl(this, this.actionSubject.filter(v => v instanceof type));
    }
    subscribe(actions, reducer) {
        this.store.subscribeReducer(actions, new ViewReducer(this.mapFunction, this.mapReverseFunction, new ReducerFunction(reducer)));
    }
    subscribeReducer(actions, reducer) {
        this.store.subscribeReducer(actions, new ViewReducer(this.mapFunction, this.mapReverseFunction, reducer));
    }
    map(map, mapReverse) {
        return new ViewStore(map, mapReverse, this);
    }
    mapPath(path) {
        return new ViewStore(StoreUtils.createMapFunction(path), StoreUtils.createMapReverseFunction(path), this);
    }
}
class ViewReducer {
    constructor(map, mapReverse, reducer) {
        this.map = map;
        this.mapReverse = mapReverse;
        this.reducer = reducer;
    }
    reduce(parentState, a) {
        let state = this.map(parentState);
        let reduceState = this.reducer.reduce(state, a);
        let result = parentState;
        if (state != reduceState) {
            result = this.mapReverse(reduceState, Object.assign({}, parentState));
        }
        return result;
    }
}
class ReducerFunction {
    constructor(reducer) {
        this.reducer = reducer;
    }
    reduce(state, a) {
        return this.reduce(state, a);
    }
}
/*********************************************    *******************************************************/
/***********************                      Test                                   ********************/
/*********************************************    *******************************************************/
/*
interface  Action2 extends Action {

}
class NameEvent {
    name:string
}

interface  ChangeNameAction extends Action {
    newName:string;
}

interface State {
    todoList:TodosList;
    name:string;
    count:number;
}

interface TodosList {
    todos:Todos[];
}

interface Todos {
    done:boolean;
    name:string;
}



let store:Store<State> = StoreManager.createStore({todoList :{todos:[]}, name:'test', count:0});

store.actionByType(NameEvent).filter(e=>e.name!==null).subscribe((state, e)=>{state.name = e.name; return  state});
store.action().filter((e:any)=>e.type==='NAME_EVENT' && e.name!==null).subscribe((state, e:any )=> e.name);

store.map(s=>s.todoList, (s,p)=> {p.todoList=s; return p}).action().subscribe((state:TodosList, a:Action )=>state);
store.mapPath('name').action().filter((e:any)=>e.type==='NAME_EVENT' && e.name!==null).subscribe((state:string, e:any )=> e.name);
store.mapPath('name').actionByType(NameEvent).filter((e:any)=> e.name!==null).subscribe((state:string, e:any )=> e.name);

let el:Element = new Element();
store.mapPath('count').subscribe(Observable.fromEvent(el, 'onClick'), (s:number,e)=>s+1);
store.mapPath('name').dispatch({type:'changeNAme', newName:'new name'});
    */ 
