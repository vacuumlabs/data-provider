import 'babel-polyfill'
import ReactDOM from 'react-dom'
import React from 'react'
import './index.css'
import {Provider} from 'react-redux'
import configureStore from './configureStore'
import {App} from './App'

const store = configureStore()

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
