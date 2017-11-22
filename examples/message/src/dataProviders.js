// this simple function returns a Promise with given data,
// with a timed delay - to simulate some real API call 
function getData(data) {
    data = {...data, body: `${data.body}, getData() called ${++getData.counter} times`}
    return new Promise(resolve => setTimeout(resolve, 4 * 1000, data))
}
getData.counter = 0

const updateMessage = () => (ref, data, dispatch) => {
    dispatch({
        type: 'msg-data',
        data: {...data},
        description: `DataProvider ref=${ref}`,
    })
}

export const messageProvider = (needed = true) => ({
    ref: 'message',
    getData: [getData, {title: 'Msg Title', body: 'Msg body'}],
    onData: [updateMessage],
    needed: needed,
    initialData: null
})
