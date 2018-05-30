"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dispatcher_1 = require("../../dispatch/dispatcher/Dispatcher");
const RemoteOrchestrator_1 = require("../orchestrator/RemoteOrchestrator");
const WorkNodeServer_1 = require("./WorkNodeServer");
class WorkNode {
    constructor(config) {
        this.config = config;
        this.jobCompletedListener = () => {
            return {
                onJobCompleted: arg => {
                    console.log("Job Completed");
                    const response = {
                        jobId: arg.id,
                        worker: this._remoteOrchestrator.remoteId,
                        result: arg.data
                    };
                    this._remoteOrchestrator.notifyComplete(response);
                },
                onJobError: (arg) => {
                    console.log("Job Completed");
                    const response = {
                        jobId: arg.id,
                        worker: this._remoteOrchestrator.remoteId,
                        result: arg.error,
                        error: true
                    };
                    this._remoteOrchestrator.notifyComplete(response);
                }
            };
        };
        this._orchAddress = config.orchestratorAddress;
        this._jobStore = config.jobstore;
        this._dispatcher = new Dispatcher_1.Dispatcher(config.dispatchConfig);
        this._server = new WorkNodeServer_1.WorkNodeServer(this, { port: config.port });
        const remote = {
            jobs: this._jobStore.jobs,
            address: config.address,
            port: config.port
        };
        this._remoteOrchestrator = new RemoteOrchestrator_1.RemoteOrchestrator(this._orchAddress);
        this.connectToOrchestrator(remote);
    }
    connectToOrchestrator(data) {
        this._remoteOrchestrator.connect(data, (r, b) => {
            this._id = r.toJSON().body.id;
        });
    }
    schedule(name, params) {
        const exists = this._jobStore.jobs.indexOf(name);
        if (exists > -1) {
            const job = this._jobStore.createFromName(name, params);
            const id = this._dispatcher.schedule(job, this.jobCompletedListener());
            return id;
        }
        else {
            return "no job found";
        }
    }
    get id() {
        return this._id;
    }
    disconnect() {
        const remote = {
            address: this.config.address,
            port: this.config.port
        };
        this._remoteOrchestrator.disconnect(remote);
        this._id = undefined;
    }
}
exports.WorkNode = WorkNode;
