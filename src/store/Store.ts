import {Observable, ReplaySubject, Subject} from "rxjs";

export interface Store<S> {
    map<T>(map:(s:S)=>T, mapReverse:(state:T,parentState:S)=>S):Store<T>;
    mapPath<T>(path:string):Store<T>
    observable():Observable<S>;
    dispatch<A>(action:A);

    action<A>():ActionManager<S,A>;
    actionByType<A>(type: new () => A):ActionManager<S,A>;
    subscribe<A>(actions:Observable<A>, reducer:(s:S, a:A)=>S):void;
    subscribeReducer<A>(actions:Observable<A>, reducer:Reducer<S,A>):void;
}

export interface ActionManager<S,A> {
    subscribeReducer(reducer:Reducer<S,A>):void;
    subscribe(reducer:(s:S, a:A)=>S):void;
    observable():Observable<A>;
    filter(filter:(a:A)=>boolean):ActionManager<S,A>;
    getStore():Store<S>;
}

export class StoreManager {
    public static createStore<S>(state:S):Store<S> {
        return new StoreImpl<S>(state);
    }
}


class StoreUtils {
    public static createMapFunction<S,T>(path:string):(s:S)=>T {
        let pathSplit:string[] = path.split(".");
        return s=> {
            let current:any = s;
            for(let el of pathSplit) {
                current = current[el];
            }
            return current;
        };
    }

    public static createMapReverseFunction<S,T>(path:string):(state:T,parentState:S)=>S {
        let pathSplit:string[] = path.split(".");
        return (s, p)=> {
            let current:any = p;
            for (let i:number=0;i<pathSplit.length-1;i++) {
                current = current[pathSplit[i]];
            }
            s[pathSplit[pathSplit.length-1]] = s;
            return p;
        };
    }
}
class StoreImpl<S> implements Store<S> {
    private stateSubject:Subject<S>;
    private currentState:S;
    private actionSubject:Subject<any>;

    constructor(private state:S) {
        this.stateSubject = new ReplaySubject(1);
        this.actionSubject = new Subject();
        this.updateState(state);
    }


    protected updateState(state: S) {
        this.currentState = state;
        this.stateSubject.next(state);
    }

    subscribeReducer<A>(actions: Observable<A>, reducer: Reducer<S, A>): void {
        actions.subscribe(a=>{
            let state:S = this.currentState;
            let newState:S = reducer.reduce(state, a);
            if (state!=newState) {
                this.updateState(newState);
            }
        })
    }
    subscribe<A>(actions: Observable<A>, reducer: (s: S, a: A) => S): void {
        this.subscribeReducer(actions, new ReducerFunction(reducer));
    }

    map<T>(map: (s: S) => T, mapReverse: (state: T, parentState: S) => S): Store<T> {
        return new ViewStore( map, mapReverse, this);
    }

    mapPath<T>(path: string): Store<T> {
        return new ViewStore<T,S>(StoreUtils.createMapFunction(path) , StoreUtils.createMapReverseFunction(path), this);
    }

    public  observable(): Observable<S> {
        return this.stateSubject;
    }

    dispatch<A>(action: A) {
        this.actionSubject.next(action);
    }

    action<A>(): ActionManager<S, A> {
        return new ActionManagerImpl(this, this.actionSubject);
    }

    actionByType<A>(type: new () => A): ActionManager<S, A> {
        return new ActionManagerImpl(this, this.actionSubject.filter(v=> v instanceof type));
    }
}

class ActionManagerImpl<S,A>  implements ActionManager<S,A>  {

    constructor(private store:Store<S>, private obs:Observable<A>) {
    }


    subscribeReducer(reducer: Reducer<S, A>): void {
        this.getStore().subscribeReducer(this.observable(), reducer);
    }

    subscribe(reducer: (s: S, a: A) => S): void {
        this.getStore().subscribe(this.observable(), reducer);
    }

    observable(): Observable<A> {
        return this.obs;
    }

    filter(filter: (a: A) => boolean):ActionManager<S,A> {
        return new FilterActionManager(this, filter);
    }

    getStore(): Store<S> {
        return this.store;
    }
}

class FilterActionManager<S,A> implements ActionManager<S,A> {
    constructor(private parent:ActionManager<S,A>, private filterFunction: (a: A) => boolean) {
    }

    subscribeReducer(reducer: Reducer<S, A>): void {
        this.getStore().subscribeReducer(this.observable(), reducer);
    }

    subscribe(reducer: (s: S, a: A) => S): void {
        this.getStore().subscribe(this.observable(), reducer);
    }

    observable(): Observable<A> {
        return this.parent.observable().filter(this.filterFunction);
    }

    filter(filter: (a: A) => boolean):ActionManager<S,A> {
        return new FilterActionManager(this, filter);
    }

    getStore(): Store<S> {
        return this.parent.getStore();
    }
}

class ViewStore<S,P> implements Store<S>{
    private actionSubject:Subject<any>;

    constructor(private mapFunction:(s:P)=>S, private mapReverseFunction:(state:S, parentState:P)=>P, private store:Store<P>) {
        this.actionSubject = new Subject();
    }


    public  observable(): Observable<S> {
        return this.store.observable().map(this.mapFunction);
    }


    dispatch<A>(action: A) {
        this.store.dispatch(action);
        this.actionSubject.next(action);
    }

    action<A>(): ActionManager<S, A> {
        return new ActionManagerImpl(this, this.actionSubject);
    }

    actionByType<A>(type: new () => A): ActionManager<S, A> {
        return new ActionManagerImpl(this, this.actionSubject.filter(v=> v instanceof type));
    }

    subscribe<A>(actions: Observable<A>, reducer: (s: S, a: A) => S): void {
        this.store.subscribeReducer(actions, new ViewReducer(this.mapFunction, this.mapReverseFunction, new ReducerFunction(reducer)));
    }

    subscribeReducer<A>(actions: Observable<A>, reducer: Reducer<S, A>): void {
        this.store.subscribeReducer(actions, new ViewReducer(this.mapFunction, this.mapReverseFunction, reducer));
    }


    public map<T>(map:(s:S)=>T, mapReverse:(state:T,parentState:S)=>S):Store<T> {
        return new ViewStore(map, mapReverse, this);
    }

    public mapPath<T>(path:string):Store<T> {
        return new ViewStore(StoreUtils.createMapFunction(path) , StoreUtils.createMapReverseFunction(path), this);
    }

}

class ViewReducer<P,S, A> implements Reducer<P,A> {

    constructor(private map:(s:P)=>S, private mapReverse:(state:S, parentState:P)=>P,
                private reducer:Reducer<S, A>) {
    }


    reduce(parentState: P, a: A): P {
        let state:S = this.map(parentState);
        let reduceState:S = this.reducer.reduce(state, a);
        let result:P = parentState;
        if (state!=reduceState) {
            result = this.mapReverse(reduceState, Object.assign({}, parentState));
        }
        return result;
    }
}


class  ReducerFunction<S, A> implements Reducer<S,A>{

    constructor(private reducer:(s:S, a:A)=>S) {

    }

    reduce(state: S, a:A): S {
        return this.reduce(state, a);
    }
}

export interface Reducer<S, A> {
    reduce( state:S, a:A):S;
}

export interface Action {
    type:string;
}


/*********************************************    *******************************************************/
/***********************                      Test                                   ********************/
/*********************************************    *******************************************************/
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