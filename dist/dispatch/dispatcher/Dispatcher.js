"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const uuid_1 = require("uuid");
const winston = require("winston");
const __1 = require("../..");
var JobStatus;
(function (JobStatus) {
    JobStatus[JobStatus["Queued"] = 0] = "Queued";
    JobStatus[JobStatus["Starting"] = 1] = "Starting";
    JobStatus[JobStatus["Running"] = 2] = "Running";
    JobStatus[JobStatus["Completed"] = 3] = "Completed";
    JobStatus[JobStatus["Failed"] = 4] = "Failed";
    JobStatus[JobStatus["Unknown"] = 5] = "Unknown";
    JobStatus[JobStatus["None"] = 6] = "None";
})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));
const defaultConfig = {
    concurrent: 3,
    cycle: 5000,
    idleCycle: 20000,
    idleCycleCount: 10,
    manualMode: false
};
class Dispatcher {
    constructor(config) {
        this._store = new __1.JobResultStore();
        this.LOGGER = winston.loggers.get("DISPATCHER");
        this.startListener = (job) => {
            this.LOGGER.info(`Job ${job} Was Started`);
            this._numberRunning++;
        };
        this.errorListener = error => {
            this.LOGGER.info(`Job ${error.id} Failed`);
            this.LOGGER.info(`${error.error}`);
            this._numberRunning--;
        };
        this.endListener = (returnValue) => {
            this.LOGGER.info(`Job ${returnValue.id} Finished`);
            this._numberRunning--;
            // set value to completed
            this._completed.push(returnValue.id);
            this._store.push(returnValue);
            // remove from running
            delete this._running[returnValue.id];
            this.LOGGER.info(`Running -> ${this._numberRunning}\n Queued -> ${this.jobsQueued()}`);
        };
        this._jobQueue = new __1.Queue();
        this._numberRunning = 0;
        this._idle = false;
        this._idleCycles = 0;
        this._running = {};
        this._listeners = {};
        this._completed = [];
        const configuration = Object.assign({}, defaultConfig, config);
        this._maxConcurrent = configuration.concurrent;
        this._cycleTime = configuration.cycle;
        this._idleCycleTime = configuration.idleCycle;
        this._idleCycleCount = configuration.idleCycleCount;
        this._cycleOff = configuration.manualMode;
        if (!this._cycleOff) {
            this.cycle();
        }
    }
    schedule(job, listener) {
        this._idleCycles = 0;
        this._idle = false;
        const id = uuid_1.v4();
        listener = listener ? listener : null;
        this._listeners[id] = listener;
        this._jobQueue.enqueue([id, job]);
        if (!this._cycleOff && this._timeoutHandle) {
            clearTimeout(this._timeoutHandle);
            this.cycle();
        }
        return id;
    }
    attachListener(id, listener) {
        if (this.isComplete(id)) {
            return "Unable to Attach To Completed Job";
        }
        else {
            if (this._listeners[id]) {
                return "Listener Already Bound";
            }
            else {
                this._listeners[id] = listener;
            }
        }
    }
    consume() {
        this.LOGGER.info(`Running -> ${this._numberRunning}\n Queued -> ${this.jobsQueued()}`);
        const queued = this._jobQueue.dequeue();
        if (queued) {
            // if queue has something
            const id = queued[0]; // job id
            const job = queued[1]; // job
            this.bind(id, job); // bind event listeners
            this._running[id] = job;
            return job.start(id); // start
        }
    }
    jobsRunning() {
        return this._numberRunning;
    }
    jobsQueued() {
        return this._jobQueue.length();
    }
    getStatus(id) {
        if (this.isComplete(id)) {
            return JobStatus.Completed;
        }
        else if (this.isRunning(id)) {
            return JobStatus.Running;
        }
        else if (this.isQueued(id)) {
            return JobStatus.Queued;
        }
        else {
            return JobStatus.Unknown;
        }
    }
    fetch(id) {
        return this.isComplete(id) ? this._store.fetch(id) : undefined;
    }
    clean(id) {
        delete this._completed[id];
        delete this._listeners[id];
    }
    cycle() {
        if (!this._cycleOff) {
            if (this.jobsQueued() > 0) {
                let slotsRemaining = this._maxConcurrent - this._numberRunning;
                while (slotsRemaining > 0) {
                    // consume
                    const consumed = this.consume();
                    slotsRemaining--;
                }
                this._timeoutHandle = setTimeout(() => this.cycle(), this._cycleTime);
            }
            else if (this._idle) {
                this._timeoutHandle = setTimeout(() => this.cycle(), this._idleCycleTime);
            }
            else {
                this._idleCycles += 1;
                if (this._idleCycles >= this._idleCycleCount) {
                    this._idle = true;
                    this._timeoutHandle = setTimeout(() => this.cycle(), this._idleCycleTime);
                }
                else {
                    this._timeoutHandle = setTimeout(() => this.cycle(), this._cycleTime);
                }
            }
        }
    }
    isComplete(id) {
        return _.includes(this._completed, id);
    }
    isRunning(id) {
        return !!this._running[id];
    }
    isQueued(id) {
        return (!this.isRunning(id) && // not running
            !this.isComplete(id) && // not complete
            // listener is defined  or null means key exists
            (this._listeners[id] || this._listeners[id] === null));
    }
    bind(id, job) {
        job.on(__1.START, this.startListener);
        job.on(__1.END, this.endListener);
        job.on(__1.ERROR, this.errorListener);
        const listener = this._listeners[id];
        if (listener) {
            if (listener.onJobStarted) {
                job.on(__1.START, listener.onJobStarted);
            }
            if (listener.onJobRunning) {
                job.on(__1.EXEC, listener.onJobRunning);
            }
            if (listener.onJobCompleted) {
                job.on(__1.END, listener.onJobCompleted);
            }
            if (listener.onJobError) {
                job.on(__1.ERROR, listener.onJobError);
            }
        }
    }
}
exports.Dispatcher = Dispatcher;
