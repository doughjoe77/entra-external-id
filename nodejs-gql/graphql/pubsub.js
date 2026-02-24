// graphql/pubsub.js
import { EventEmitter } from "events";

class PubSub {
  constructor() {
    this.ee = new EventEmitter();
    this.ee.setMaxListeners(50);
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

    return {
      async next() {
        console.log("[PUBSUB] next() called for event:", event);

        return new Promise(resolve => {
          const handler = (payload) => {
            console.log("[PUBSUB] EVENT RECEIVED:", event);
            console.log("         payload =", payload);

            ee.removeListener(event, handler);

            const result = { value: payload, done: false };
            console.log("[PUBSUB] yielding result =", result);

            resolve(result);
          };

          console.log("[PUBSUB] listener attached for event:", event);
          ee.on(event, handler);
        });
      },

      return() {
        console.log("[PUBSUB] return() called for event:", event);
        return { value: undefined, done: true };
      },

      throw(error) {
        console.log("[PUBSUB] throw() called:", error);
        throw error;
      },

      [Symbol.asyncIterator]() {
        console.log("[PUBSUB] Symbol.asyncIterator() called for event:", event);
        return this;
      }
    };
  }
}

export const pubsub = new PubSub();
