import Vue from 'vue'
import StoRx from 'storx'
import { state, mutations } from './mutations'
import plugins from './plugins'

//Vue.use(StoRx)

export default new StoRx.createStore(state)
