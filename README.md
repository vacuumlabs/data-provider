![alt text](dataproviders.png "Logo Title Text 1")


Library that helps with server-to-client synchronization of data. Depends on
React, plays well with Redux.

The contract:

* Decorate your React component, provide config where you specify how to get
  data and what to do with it (e.g. dispatch to app state)
* You can count on the data being available as the decorated component renders

The example should get you going - detailed API docs pending :).

#### Example

```js
class BlogPost extends React.Component {
  render() {
    let {title, body} = this.props
    return (
      <div>
        <h2> {title} </h2>
        <div> {body} </div>
      </div>
    )
  }
}

const updateBlogPost = (blogPostId) => (ref, data, dispatch) => {
  dispatch({
    type: 'on-blog-post-data',
    payload: {blogPostId, data},
    description: `DataProvider ref=${ref}`,
  })
}

compose(
  withDataProviders((props) => [
    {
      // Unique reference; should work well with lodash.isEqual (string, array, object, ...)
      // and should depend on the same parameters as getData / onData do
      ref: ['blog-post', props.blogPostId],
      // Possibly async (promise-returning) function how to fetch data.
      // Optionally can be expressed in clojure-like fashion, i.e. [fn, arg1, arg2, ...]
      getData: () => fetch(`/api/blog-post/${props.blogPostId}`),
      // What to do with obtained data. Dispatch is taken from context,
      // which is the case if you are using this with redux and react-redux.
      onData: (ref, data, dispatch) => updateBlogPost(props.blogPostId),
      // How often to refetch data, in milliseconds
      polling: 10 * 60 * 1000,
      // The component is not rendered until data is fetched.
      // Defaults to true; false can be used for eager pre-fetching of data for child
      // components
      needed: true,
      // How long to keep the data alive, so it isn't refetched unnecessarily 
      // Optional, defaults to 0 (disabled), in milliseconds
      keepAliveFor: 10 * 60 * 1000,
      // Optionally, the (first) fetch can be skipped by providing initialData (for
      // example, data can be put to html-data-attribute during server-side rendering)
      initialData: {title: ..., body: ...},
      // Optionally, override the default responseHandler behavior,
      // see Global Configuration section for details
      responseHandler: ...,
      // Optionally, override the default loading or error component by defining your own, or 
      // set it null to disable
      loadingComponent: <MyLoadingComponent />,
      errorComponent: <MyErrorComponent />
    },
    // more data providers...
  ]),
  connect((state, props) => state.blogData[props.blogPostId]))
)(BlogPost)

```

### Global Configuration

You can override some default settings and behavior by calling the `dataProvidersConfig({...})` function.

Optional overridable settings:
 * `responseHandler` - function that accepts `response` from user defined `getData()` function and processes it.
 Default implementation expects a `Response` object (but simply returns `response` otherwise), and tries to parse
 the body as JSON object.
 * `loadingComponent` - component to display when DataProvider is fetching data
 * `errorComponent` - component to display when DataProvider fails initial fetch or refetch
 * `fetchTimeout` - time in milliseconds after which a new fetch (user supplied `getData`) is called. Default is 30s
 * `maxTimeoutRetries` - max number of retries of the `getData` call after timeout. Default is 5
 
#### Example

```js
dataProvidersConfig({
  responseHandler: (response) => response,
  loadingComponent: <MyLoadingComponent />,
  errorComponent: <MyErrorComponent />,
  fetchTimeout: 60 * 1000,
  maxTimeoutRetries: 1
})
```