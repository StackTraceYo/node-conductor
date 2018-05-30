"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class JobStore {
    constructor(config) {
        this._jobs = config.jobs;
        this._jobnames = [];
        _.forEach(this._jobs, (value, key) => {
            this.register(key, value);
        });
    }
    createFromName(name, params) {
        const type = this._jobs[name];
        if (type) {
            return this.create(name, type, params);
        }
    }
    register(name, type) {
        this._jobs[name] = type;
        this._jobnames.push(name);
    }
    create(name, type, params) {
        return new type(name, params);
    }
    get jobs() {
        return this._jobnames;
    }
}
exports.JobStore = JobStore;
