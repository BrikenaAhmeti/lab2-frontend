type Subscriber = (token: string) => void;
let isRefreshing = false;
let subscribers: Subscriber[] = [];
export const getRefreshing = () => isRefreshing;
export const setRefreshing = (v: boolean) => { isRefreshing = v; };
export const addSubscriber = (cb: Subscriber) => { subscribers.push(cb); };
export const flushSubscribers = (token: string) => { subscribers.forEach(cb => cb(token)); subscribers = []; };
