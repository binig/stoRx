import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {ReplaySubject} from "rxjs/ReplaySubject";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/distinct';

export namespace StoRx {

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
        mapFunction<T>(id:string, map: (s: S) => T, mapReverse: (state: T, parentState: S) => S): Store<T>;

        /**
         * create a view on the substate designed by the path
         * @param {string} path to the substate
         * @returns {Store<T>} a view store on 'path' substate
         */
        map<T>(path: string): Store<T>

        /**
         * @returns {Observable<S>} an observable with the store state will be trigger when the state is updated
         */
        observable(): Observable<S>;

        /**
         * trigger an action on the store that may then trigger reducer, the action will propagate to parent store
         * @param {A} action the action to trigger
         */
        dispatch<A>(action: A);

        /**
         * @returns {ActionManager<S, A>} an action manager to be used to bind reducer to dispatched action
         */
        action<A>(): ActionManager<S, A>;

        /**
         *
         * @param {{new() => A}} type type of action manage
         * @returns {ActionManager<S, A>} an action manager working on 'type' action
         */
        actionByType<A>(type: new () => A): ActionManager<S, A>;


        /**
         * directly subscribe a reducer on an observable
         * @param {Observable<A>} actions the observable the reducer will subscribe
         * @param {(s: S, a: A) => S} reducer function
         */
        subscribe<A>(actions: Observable<A>, reducer: (s: S, a: A) => S): void;

        /**
         * directly subscribe a reducer on an observable
         * @param {Observable<A>} actions the observable the reducer will subscribe
         * @param {(s: S, a: A) => S} reducer object
         */
        subscribeReducer<A>(actions: Observable<A>, reducer: Reducer<S, A>): void;
    }

    /**
     * an action manager is a class to bind to reducer to store internal action dispatcher
     * it can also be use to monitor emitted action via the observable()
     */
    export interface ActionManager<S, A> {
        /**
         * subscribe a reducer object to the action this manager handle
         * @param {Reducer<S, A>} reducer
         */
        subscribeReducer(reducer: Reducer<S, A>): void;

        /**
         * subscribe a reducer function to the action this manager handle
         * @param {Reducer<S, A>} reducer
         */
        subscribe(reducer: (s: S, a: A) => S): void;

        /**
         *
         * @returns {Observable<A>} the observable of the actions managed
         */
        observable(): Observable<A>;

        /**
         * build a new actionManager that will handle the subset of action that pass the filter function
         * @param {(a: A) => boolean} filter function to filter actions
         * @returns {ActionManager<S, A>} the new action manage that handle the filtered actions
         */
        filter(filter: (a: A) => boolean): ActionManager<S, A>;

        /**
         *
         * @returns {Store<S>} the store associated with this action manager
         */
        getStore(): Store<S>;
    }

    export function  createStore<S>(state: S): Store<S> {
        return new StoreImpl<S>(state);
    }


    interface Event<A> {
        source:string;
        event:A;
    }

    interface StoreDispatcher<S> extends Store<S> {

        /**
         *
         * @returns {Observable<A>} an observable of all the action emitted on the store
         */
        actions<A>(): Observable<Event<A>>;

        dispatchWithSource<A>(action: A, source:string);

        /**
         * directly subscribe a reducer on an observable
         * @param {Observable<A>} actions the observable the reducer will subscribe
         * @param {(s: S, a: A) => S} reducer function
         */
        subscribeEvent<A>(actions: Observable<Event<A>>, reducer: (s: S, a: A) => S): void;

        /**
         * directly subscribe a reducer on an observable
         * @param {Observable<A>} actions the observable the reducer will subscribe
         * @param {(s: S, a: A) => S} reducer object
         */
        subscribeReducerEvent<A>(actions: Observable<Event<A>>, reducer: Reducer<S, A>): void;

    }

    class StoreUtils {
        public static createMapFunction<S, T>(path: string): (s: S) => T {
            let pathSplit: string[] = path.split(".");
            return s => {
                let current: any = s;
                for (let el of pathSplit) {
                    current = current[el];
                }
                return current;
            };
        }

        public static createMapReverseFunction<S, T>(path: string): (state: T, parentState: S) => S {
            let pathSplit: string[] = path.split(".");
            return (s, p) => {
                let current: any = p;
                for (let i: number = 0; i < pathSplit.length - 1; i++) {
                    current = current[pathSplit[i]];
                }
                current[pathSplit[pathSplit.length - 1]] = s;
                return p;
            };
        }
    }

    class StoreImpl<S> implements StoreDispatcher<S> {
        private stateSubject: Subject<S>;
        private currentState: S;
        private actionSubject: Subject<Event<any>>;

        constructor(private state: S) {
            this.stateSubject = new ReplaySubject(1);
            this.actionSubject = new Subject();
            this.updateState(state);
        }


        protected updateState(state: S) {
            this.currentState = state;
            this.stateSubject.next(state);
        }

        subscribeReducer<A>(actions: Observable<A>, reducer: Reducer<S, A>): void {
            actions.subscribe(a => {
                let state: S = this.currentState;
                let newState: S = reducer.reduce(state, a);
                if (state != newState) {
                    this.updateState(newState);
                }
            })
        }

        subscribe<A>(actions: Observable<A>, reducer: (s: S, a: A) => S): void {
            this.subscribeReducer(actions, new ReducerFunction(reducer));
        }


        subscribeEvent<A>(actions: Observable<Event<A>>, reducer: (s: S, a: A) => S): void {
            this.subscribe(actions.map(e=>e.event), reducer);
        }

        subscribeReducerEvent<A>(actions: Observable<Event<A>>, reducer: Reducer<S, A>): void {
            this.subscribeReducer(actions.map(e=>e.event), reducer);
        }

        mapFunction<T>(id:string, map: (s: S) => T, mapReverse: (state: T, parentState: S) => S): Store<T> {
            return new ViewStore(id, map, mapReverse, this);
        }

        map<T>(path: string): Store<T> {
            return new ViewStore<T, S>(path, <(s: S) => T>StoreUtils.createMapFunction(path), <(state: T, parentState: S) => S>StoreUtils.createMapReverseFunction(path), this);
        }

        public observable(): Observable<S> {
            return this.stateSubject;
        }

        dispatch<A>(action: A) {
            this.dispatchWithSource(action, '');
        }

        dispatchWithSource<A>(action: A, source:string) {
            this.actionSubject.next({source:source, event:action});
        }

        action<A>(): ActionManager<S, A> {
            return new ActionManagerImpl(this, this.actionSubject);
        }

        actionByType<A>(type: new () => A): ActionManager<S, A> {
            return new ActionManagerImpl(this, this.actionSubject.asObservable().filter(v => v.event instanceof type));
        }

        actions<A>(): Observable<Event<A>> {
            return this.actionSubject;
        }
    }


    interface ActionManagerDispatcher<S, A> extends ActionManager<S, A> {

        observableEvent():Observable<Event<A>>;

        getStoreDispatcher():StoreDispatcher<S>;
    }

    class ActionManagerImpl<S, A>  implements ActionManagerDispatcher<S, A> {

        constructor(private store: StoreDispatcher<S>, private obs: Observable<Event<A>>) {
        }


        subscribeReducer(reducer: Reducer<S, A>): void {
            this.getStoreDispatcher().subscribeReducerEvent(this.observableEvent(), reducer);
        }

        subscribe(reducer: (s: S, a: A) => S): void {
            this.getStoreDispatcher().subscribeEvent(this.observableEvent(), reducer);
        }

        observable(): Observable<A> {
            return this.obs.map(e=>e.event);
        }


        observableEvent(): Observable<Event<A>> {
            return this.obs;
        }

        filter(filter: (a: A) => boolean): ActionManager<S, A> {
            return new FilterActionManager(this, filter);
        }

        getStore(): Store<S> {
            return this.store;
        }

        getStoreDispatcher(): StoreDispatcher<S> {
            return this.store;
        }
    }

    class FilterActionManager<S, A> implements ActionManagerDispatcher<S, A> {
        constructor(private parent: ActionManagerDispatcher<S, A>, private filterFunction: (a: A) => boolean) {
        }

        subscribeReducer(reducer: Reducer<S, A>): void {
            this.getStoreDispatcher().subscribeReducerEvent(this.observableEvent(), reducer);
        }

        subscribe(reducer: (s: S, a: A) => S): void {
            this.getStoreDispatcher().subscribeEvent(this.observableEvent(), reducer);
        }

        observable(): Observable<A> {
            return this.parent.observable().filter(this.filterFunction);
        }


        observableEvent(): Observable<Event<A>> {
            return this.parent.observableEvent().filter(e=>this.filterFunction(e.event));
        }

        filter(filter: (a: A) => boolean): ActionManager<S, A> {
            return new FilterActionManager(this, filter);
        }

        getStore(): Store<S> {
            return this.parent.getStore();
        }

        getStoreDispatcher(): StoreDispatcher<S> {
            return this.parent.getStoreDispatcher();
        }
    }

    class ViewStore<S, P> implements StoreDispatcher<S> {

        constructor(private id:string, private mapFunc: (s: P) => S, private mapReverseFunction: (state: S, parentState: P) => P, private store: StoreDispatcher<P>) {
        }


        public observable(): Observable<S> {
            return this.store.observable().map(this.mapFunc).distinct();
        }


        dispatch<A>(action: A) {
            this.store.dispatchWithSource(action, this.id);
        }


        dispatchWithSource<A>(action: A, source: string) {
            this.store.dispatchWithSource(action, source);
        }

        action<A>(): ActionManager<S, A> {
            return new ActionManagerImpl(this, this.store.actions());
        }

        actionByType<A>(type: new () => A): ActionManager<S, A> {
            return new ActionManagerImpl(this, <Observable<Event<A>>>this.store.actions().filter(v => v.event instanceof type));
        }

        subscribe<A>(actions: Observable<A>, reducer: (s: S, a: A) => S): void {
            this.store.subscribeReducer(actions, new ViewReducer(this.mapFunc, this.mapReverseFunction, new ReducerFunction(reducer)));
        }

        subscribeReducer<A>(actions: Observable<A>, reducer: Reducer<S, A>): void {
            this.store.subscribeReducer(actions, new ViewReducer(this.mapFunc, this.mapReverseFunction, reducer));
        }


        subscribeEvent<A>(actions: Observable<Event<A>>, reducer: (s: S, a: A) => S): void {
            this.store.subscribeReducerEvent(actions.filter(event=> event.source.startsWith(this.id)), new ViewReducer(this.mapFunc, this.mapReverseFunction, new ReducerFunction(reducer)));
        }

        subscribeReducerEvent<A>(actions: Observable<Event<A>>, reducer: Reducer<S, A>): void {
            this.store.subscribeReducerEvent(actions.filter(event=> event.source.startsWith(this.id)), new ViewReducer(this.mapFunc, this.mapReverseFunction, reducer));
        }

        public mapFunction<T>(id:string, map: (s: S) => T, mapReverse: (state: T, parentState: S) => S): Store<T> {
            return new ViewStore(this.id+"."+id, map, mapReverse, this);
        }

        public map<T>(path: string): Store<T> {
            return new ViewStore(this.id+"."+path, StoreUtils.createMapFunction(path), StoreUtils.createMapReverseFunction(path), this);
        }


        actions<A>(): Observable<Event<A>> {
            return this.store.actions();
        }
    }

    class ViewReducer<P, S, A> implements Reducer<P, A> {

        constructor(private map: (s: P) => S, private mapReverse: (state: S, parentState: P) => P,
                    private reducer: Reducer<S, A>) {
        }


        reduce(parentState: P, a: A): P {
            let state: S = this.map(parentState);
            let reduceState: S = this.reducer.reduce(state, a);
            let result: P = parentState;
            if (state != reduceState) {
                result = this.mapReverse(reduceState, Object.assign({}, parentState));
            }
            return result;
        }
    }


    class ReducerFunction<S, A> implements Reducer<S, A> {

        constructor(private reducer: (s: S, a: A) => S) {

        }

        reduce(state: S, a: A): S {
            return this.reducer(state, a);
        }
    }

    export interface Reducer<S, A> {
        reduce(state: S, a: A): S;
    }

}