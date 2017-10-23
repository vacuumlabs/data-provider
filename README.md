# Data Provider

Library that helps with server-to-client synchronization of data. Depends on
React, plays well with Redux.

The contract:

* Decorate your React component, provide config where you specify how to get
  data and what to do with it (e.g. dispatch to app state)
* You can count on the data being fetched and handled when writing the code for
  the decoraded React component

# Example

```
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
      // Unique reference; should work well with lodash.isEqual (string,
      // array, object, ...)
      ref: ['blog-post', props.blogPostId],
      // Possibly async (promise-returning) function how to fetch data.
      // Expressed in clojure-like fashion, i.e. [fn, arg1, arg2, ...]
      getData: [fetch, `/api/blog-post/${props.blogPostId}`],
      // What to do with obtaned data. onData [fn, arg1, arg2] means that
      // fn(arg1, arg2)(ref, data, dispatch) will be called. Dispatch is taken from
      // context, which is the case if you are using this with redux and react-redux.
      onData: [updateBlogPost, props.blogPostId],
      // How often to refetch data, in milliseconds
      polling: 10 * 60 * 1000,
      // The component is not rendered until data is fetched.
      // Defaults to true; false can be used for eager pre-fetchig of data for child
      // components
      needed: true,
      // Optionally, the (first) fetch can be skipped by providing initialData (for
      // example, data can be put to html-data-attribute during server-side rendering)
      initialData: {title: ..., body: ...}
    },
    // more data providers...
  ]),
  connect((state, props) => state.blogData[props.blogPostId]))
)(BlogPost)

```
