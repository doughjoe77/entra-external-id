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

  asyncIterator(event) {
    console.log("[PUBSUB] asyncIterator() created for event:", event);

    const ee = this.ee;
    const queue = [];
    let listening = true;

    const handler = payload => {
      console.log("[PUBSUB] EVENT RECEIVED:", event, payload);
      queue.push(payload);
    };

    ee.on(event, handler);

    return {
      async next() {
        while (queue.length === 0) {
          if (!listening) {
            return { value: undefined, done: true };
          }
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        const value = queue.shift();
        return { value, done: false };
      },

      return() {
        listening = false;
        ee.removeListener(event, handler);
        return { value: undefined, done: true };
      },

      throw(error) {
        listening = false;
        ee.removeListener(event, handler);
        throw error;
      },

      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
}

export const pubsub = new PubSub();
