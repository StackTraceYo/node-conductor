"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RemoteWorker {
    constructor(id, address, jobs) {
        this._id = id;
        this._address = address;
        this._jobs = jobs;
    }
    get jobs() {
        return this._jobs;
    }
    get id() {
        return this._id;
    }
    get address() {
        return this._address;
    }
}
exports.RemoteWorker = RemoteWorker;
//# sourceMappingURL=RemoteWorker.js.map