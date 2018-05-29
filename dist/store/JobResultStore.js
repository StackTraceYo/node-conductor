"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JobResultStore {
    constructor() {
        this._finishedData = {};
    }
    push(result) {
        this._finishedData[result.id] = result;
    }
    fetch(id) {
        return this._finishedData[id];
    }
    get(id) {
        const res = this._finishedData[id];
        if (res) {
            delete this._finishedData[id];
        }
        return res;
    }
    jobResults() {
        return this._finishedData;
    }
}
exports.JobResultStore = JobResultStore;
//# sourceMappingURL=JobResultStore.js.map