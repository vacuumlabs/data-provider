import React from 'react'
import {BrowserRouter as Router, Route, NavLink, Switch} from 'react-router-dom'
import {NestedProvidersExample} from './NestedProvidersExample'
import {SingleDataProviderExample} from './SingleProviderExample'
import {PollingExample} from './PollingExample'
import {ResponseHandlerExample} from './ResponseHandlerExample'

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
  {path: '/responseHandler',
    component: ResponseHandlerExample,
    title: 'Response Handler'
  }
]

const Navigation = () => (
  <ul className="nav">
    <li><NavLink exact to="/">Home</NavLink></li>

    {exampleRoutes.map((route, index) => (
      <li key={index}><NavLink to={route.path}>{route.title}</NavLink></li>
    ))}
  </ul>
)

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
