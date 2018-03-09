export class Queue<T> {

    private _queued: T[] = [];

    public enqueue(val: T) {
        this._queued.push(val);
    }

    public dequeue(): T | undefined {
        return this._queued.shift();
    }

    public peek(): T | undefined {
        return this._queued.length > 0 ? this._queued[0] : undefined;
    }

    public length() {
        return this._queued.length;
    }

    public isEmpty() {
        return !(this._queued.length > 0);
    }
}