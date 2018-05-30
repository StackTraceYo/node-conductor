"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const request = require("request");
const winston = require("winston");
const JobResultStore_1 = require("../../store/JobResultStore");
const DispatchStrategy_1 = require("../strategy/DispatchStrategy");
const OrchestratorServer_1 = require("./OrchestratorServer");
class Orchestrator {
    constructor(config) {
        this.LOGGER = winston.loggers.get("ORCHESTRATOR");
        this.__workers = [];
        this._workersById = {};
        this._workers = {};
        this._pending = {};
        this._completed = {};
        this._listeners = {};
        this._errors = {};
        this._jobStore = new JobResultStore_1.JobResultStore();
        if (config.startServer) {
            this._server = new OrchestratorServer_1.OrchestratorServer(this);
        }
        this._strategy = DispatchStrategy_1.DispatchStrategy.createFromType(config.strategy || DispatchStrategy_1.DispatchStrategyType.ROUND_ROBIN);
    }
    register(address, worker) {
        this._workers[address] = worker;
        this._workersById[worker.id] = worker;
        const newWorkers = _.filter(this.__workers, value => {
            return value.address !== address;
        });
        newWorkers.push(worker);
        this.__workers = newWorkers;
        this._strategy.workers = newWorkers;
    }
    unregister(address, id) {
        const unregistering = this._workers[address];
        if (unregistering) {
            delete this._workersById[unregistering.id];
            delete this._workers[address];
        }
        const newWorkers = _.filter(this.__workers, value => {
            return value.address !== address;
        });
        this.__workers = newWorkers;
        this._strategy.workers = newWorkers;
    }
    schedule(name, params, listener) {
        this.LOGGER.info("info", "Scheduling..");
        let remote = -1;
        let cycle = 0;
        while (remote === -1 && cycle < this.__workers.length) {
            const pick = this._strategy.pick();
            remote = pick.jobs.indexOf(name);
            cycle += 1;
        }
        if (remote === -1) {
            return { message: "no suitable node found" };
        }
        else {
            const worker = this.__workers[remote];
            this.LOGGER.info("Selected: ", worker);
            const api = `${worker.address}/worker/schedule`;
            request.post(api, { json: { name, params } }, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const id = response.body.message;
                    this.LOGGER.info(`Successfully Scheduled ${id} to Node at ${worker.address}`);
                    this.pend(id, worker);
                    listener = listener ? listener : null;
                    this._listeners[id] = listener;
                    this.LOGGER.debug(" Pending", this._pending);
                }
                else {
                    this.LOGGER.error(`Error Scheduling to Node at ${worker.address}: `, body);
                }
            });
        }
    }
    pend(id, worker) {
        this._pending[id] = { worker: worker.id };
    }
    complete(worker, job, result) {
        this.LOGGER.info(`Job ${job} from remote worker ${worker} finished`);
        const listener = this._listeners[job];
        if (listener) {
            listener.onJobCompleted(result);
        }
        const pending = this._pending[job];
        if (pending.worker === worker) {
            delete this._pending[job];
            this._completed[job] = { worker };
            this._jobStore.push({
                data: result,
                id: job,
                worker,
            });
        }
    }
    error(worker, job, result) {
        this.LOGGER.info(`Job ${job} from remote worker ${worker} finished with an error`);
        const listener = this._listeners[job];
        if (listener) {
            listener.onJobError(result);
        }
        const pending = this._pending[job];
        if (pending.worker === worker) {
            delete this._pending[job];
            this._errors[job] = { worker, error: result };
            this._jobStore.push({
                data: result,
                error: true,
                id: job,
                worker
            });
        }
    }
    get all() {
        const pending = _.map(this._pending, (value, key) => {
            return {
                id: key,
                status: "pending",
                worker: value.worker,
            };
        });
        const completed = _.map(this._jobStore.jobResults(), (value, key) => {
            return {
                id: key,
                status: value.error ? "error" : "done",
                worker: value.worker
            };
        });
        return {
            jobs: _.unionBy(pending, completed, "id")
        };
    }
    get completed() {
        const completed = _.map(this._jobStore.jobResults(), (value, key) => {
            return {
                id: key,
                status: value.error ? "error" : "done",
                worker: value.worker
            };
        });
        return {
            jobs: completed
        };
    }
    get errored() {
        const completed = _.map(this._jobStore.jobResults(), (value, key) => {
            return {
                id: key,
                status: value.error ? "error" : "done",
                worker: value.worker
            };
        });
        return {
            jobs: _.filter(completed, value => value.status === "error")
        };
    }
    get pending() {
        const pending = _.map(this._pending, (value, key) => {
            return {
                id: key,
                status: "pending",
                worker: value.worker
            };
        });
        return {
            jobs: pending
        };
    }
    status(id) {
        const pending = this._pending[id];
        const res = !pending ? this._completed[id] : pending;
        const err = this._errors[id];
        if (err) {
            return {
                status: "error",
                worker: err.worker
            };
        }
        else {
            return {
                status: pending ? "pending" : res ? "done" : "unknown",
                worker: res ? res.worker : "unknown"
            };
        }
    }
    fetch(id) {
        return this.isComplete(id) ? this._jobStore.fetch(id) : undefined;
    }
    get(id) {
        return this.isComplete(id) ? this._jobStore.get(id) : undefined;
    }
    isComplete(id) {
        return !!this._completed[id] || !!this._errors[id];
    }
    get workers() {
        return this._workers;
    }
    get listeners() {
        return this._listeners;
    }
    get jobStore() {
        return this._jobStore;
    }
    get workerslist() {
        return this.__workers;
    }
    get idworkers() {
        return this._workersById;
    }
    get strategy() {
        return this._strategy;
    }
}
exports.Orchestrator = Orchestrator;
