import React from 'react'
import {connect} from 'react-redux'
import {BrowserRouter as Router, Route, NavLink, Switch} from 'react-router-dom'
import {NestedProvidersExample} from './NestedProvidersExample'
import {SingleDataProviderExample} from './SingleProviderExample'
import {PollingExample} from './PollingExample'
import {resetGetDataCounter} from './getData'
import {resetState} from './actions'

const Home = () => (<div><p>Choose an example</p></div>)

const exampleRoutes = [
  {path: '/singleProvider',
    component: SingleDataProviderExample,
    title: 'Single Data Provider'
  },
  {path: '/nestedProviders',
    component: NestedProvidersExample,
    title: 'Nested Data Providers'
  },
  {path: '/polling',
    component: PollingExample,
    title: 'Polling'
  },
]

const NavigationLinks = ({resetAll}) => (
  <ul className="nav">
    <li><NavLink exact to="/">Home</NavLink></li>

    {exampleRoutes.map((route, index) => (
      <li key={index}><NavLink to={route.path} onClick={resetAll}>{route.title}</NavLink></li>
    ))}
  </ul>
)

const Navigation = connect(null, (dispatch) => ({
  resetAll: () => {
    resetGetDataCounter()
    dispatch(resetState())
  }
}), null, {pure: false})(NavigationLinks)

export const App = () => (
  <Router>
    <div className="App">
      <Navigation />
      <Switch>
        <Route exact path="/" component={Home} />
        {exampleRoutes.map((route, index) => (
          <Route key={index} path={route.path} component={route.component} />
        ))}
      </Switch>
    </div>
  </Router>
)
