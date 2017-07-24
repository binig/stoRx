import {Observable, ReplaySubject, Subject} from "rxjs";

/**
 *
 */
export interface Store<S> {

    /**
     * create a view on the store pointing of a substate extracted by the @param mapFunction function
     * @param {(s: S) => T} map function to extract the substate the view will be based on
     * @param {(state: T, parentState: S) => S} mapReverse mapFunction function to reinject the substate in the parent state, this is used when the substate is updated
     * @returns {Store<T>} a view store on the substate
     */
    mapFunction<T>(map:(s:S)=>T, mapReverse:(state:T, parentState:S)=>S):Store<T>;

    /**
     * create a view on the substate designed by the path
     * @param {string} path to the substate
     * @returns {Store<T>} a view store on 'path' substate
     */
    map<T>(path:string):Store<T>

    /**
     * @returns {Observable<S>} an observable with the store state will be trigger when the state is updated
     */
    observable():Observable<S>;

    /**
     * trigger an action on the store that may then trigger reducer, the action will propagate to parent store
     * @param {A} action the action to trigger
     */
    dispatch<A>(action:A);

    /**
     * @returns {ActionManager<S, A>} an action manager to be used to bind reducer to dispatched action
     */
    action<A>():ActionManager<S,A>;

    /**
     *
     * @param {{new() => A}} type type of action manage
     * @returns {ActionManager<S, A>} an action manager working on 'type' action
     */
    actionByType<A>(type: new () => A):ActionManager<S,A>;

    /**
     * directly subscribe a reducer on an observable
     * @param {Observable<A>} actions the observable the reducer will subscribe
     * @param {(s: S, a: A) => S} reducer function
     */
    subscribe<A>(actions:Observable<A>, reducer:(s:S, a:A)=>S):void;
    /**
     * directly subscribe a reducer on an observable
     * @param {Observable<A>} actions the observable the reducer will subscribe
     * @param {(s: S, a: A) => S} reducer object
     */
    subscribeReducer<A>(actions:Observable<A>, reducer:Reducer<S,A>):void;
}

/**
 * an action manager is a class to bind to reducer to store internal action dispatcher
 * it can also be use to monitor emitted action via the observable()
 */
export interface ActionManager<S,A> {
    /**
     * subscribe a reducer object to the action this manager handle
     * @param {Reducer<S, A>} reducer
     */
    subscribeReducer(reducer:Reducer<S,A>):void;
    /**
     * subscribe a reducer function to the action this manager handle
     * @param {Reducer<S, A>} reducer
     */
    subscribe(reducer:(s:S, a:A)=>S):void;

    /**
     *
     * @returns {Observable<A>} the observable of the actions managed
     */
    observable():Observable<A>;

    /**
     * build a new actionManager that will handle the subset of action that pass the filter function
     * @param {(a: A) => boolean} filter function to filter actions
     * @returns {ActionManager<S, A>} the new action manage that handle the filtered actions
     */
    filter(filter:(a:A)=>boolean):ActionManager<S,A>;

    /**
     *
     * @returns {Store<S>} the store associated with this action manager
     */
    getStore():Store<S>;
}


export class StoreManager {
    /**
     *
     * @param {S} state initial state
     * @returns {Store<S>} create a store with the initial state
     */
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
            current[pathSplit[pathSplit.length-1]] = s;
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

    mapFunction<T>(map: (s: S) => T, mapReverse: (state: T, parentState: S) => S): Store<T> {
        return new ViewStore( map, mapReverse, this);
    }

    map<T>(path: string): Store<T> {
        return new ViewStore<T,S>(<(s: S) => T>StoreUtils.createMapFunction(path) , <(state: T, parentState: S) => S>StoreUtils.createMapReverseFunction(path), this);
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

    constructor(private mapFunc:(s:P)=>S, private mapReverseFunction:(state:S, parentState:P)=>P, private store:Store<P>) {
        this.actionSubject = new Subject();
    }


    public  observable(): Observable<S> {
        return this.store.observable().map(this.mapFunc).distinct();
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
        this.store.subscribeReducer(actions, new ViewReducer(this.mapFunc, this.mapReverseFunction, new ReducerFunction(reducer)));
    }

    subscribeReducer<A>(actions: Observable<A>, reducer: Reducer<S, A>): void {
        this.store.subscribeReducer(actions, new ViewReducer(this.mapFunc, this.mapReverseFunction, reducer));
    }


    public mapFunction<T>(map:(s:S)=>T, mapReverse:(state:T, parentState:S)=>S):Store<T> {
        return new ViewStore(map, mapReverse, this);
    }

    public map<T>(path:string):Store<T> {
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
        return this.reducer(state, a);
    }
}

export interface Reducer<S, A> {
    reduce( state:S, a:A):S;
}
