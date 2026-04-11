let isRefreshing = false;
let subscribers = [];
export const getRefreshing = () => isRefreshing;
export const setRefreshing = (v) => { isRefreshing = v; };
export const addSubscriber = (cb) => { subscribers.push(cb); };
export const flushSubscribers = (token) => { subscribers.forEach(cb => cb(token)); subscribers = []; };
