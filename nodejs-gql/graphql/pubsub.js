// graphql/pubsub.js
import { EventEmitter } from "events";

class PubSub {
  constructor() {
    this.ee = new EventEmitter();
    this.ee.setMaxListeners(1000);
  }

  publish(event, payload) {
    console.log("[PUBSUB] publish() called");
    console.log("         event =", event);
    console.log("         payload =", payload);

    this.ee.emit(event, payload);
  }

  asyncIterator(event, onStop) {
    const ee = this.ee;
    const queue = [];
    let listening = true;

    const handler = payload => queue.push(payload);
    ee.on(event, handler);

    return {
      async next() {
        while (queue.length === 0) {
          if (!listening) return { value: undefined, done: true };
          await new Promise(r => setTimeout(r, 10));
        }
        return { value: queue.shift(), done: false };
      },

      return() {
        listening = false;
        ee.removeListener(event, handler);
        if (onStop) onStop();   // 🔥 notify resolver that client disconnected
        return { value: undefined, done: true };
      },

      throw(err) {
        listening = false;
        ee.removeListener(event, handler);
        if (onStop) onStop();
        throw err;
      },

      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }

}

export const pubsub = new PubSub();
