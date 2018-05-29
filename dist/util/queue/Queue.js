"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Queue {
    constructor() {
        this._queued = [];
    }
    enqueue(val) {
        this._queued.push(val);
    }
    dequeue() {
        return this._queued.shift();
    }
    peek() {
        return this._queued.length > 0 ? this._queued[0] : undefined;
    }
    length() {
        return this._queued.length;
    }
    isEmpty() {
        return !(this._queued.length > 0);
    }
}
exports.Queue = Queue;
//# sourceMappingURL=Queue.js.map