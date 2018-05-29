import * as _ from "lodash";
import * as request from "request";
import * as winston from "winston";
import {JobListener} from "../../dispatch/job/Job";
import {JobResultStore, RemoteJobResult} from "../../store/JobResultStore";
import {DispatchStrategy, DispatchStrategyType} from "../strategy/DispatchStrategy";
import {RemoteWorker} from "../worker/RemoteWorker";
import {OrchestratorServer} from "./OrchestratorServer";

export interface OrchestratorConfig {
    strategy: DispatchStrategyType;
    startServer: boolean;
}

export class Orchestrator {
    // registered workers
    private readonly _workers: { [key: string]: RemoteWorker };
    private readonly _workersById: { [key: string]: RemoteWorker };
    // job completion listeners
    private readonly _listeners: { [key: string]: JobListener };

    // pending ids and their worker
    private readonly _pending: {
        [key: string]: {
            worker: string;
        };
    };

    // completed jobs their works and the result
    private readonly _completed: {
        [key: string]: {
            worker: string;
        };
    };

    private readonly _errors: {
        [key: string]: {
            worker: string;
            error: any;
        };
    };

    private readonly _jobStore: JobResultStore<RemoteJobResult>;

    // array of workers
    private __workers: RemoteWorker[];
    private _strategy: DispatchStrategy;
    // server
    private _server: OrchestratorServer;
    private LOGGER = winston.loggers.get("ORCHESTRATOR");

    constructor(config: OrchestratorConfig) {
        this.__workers = [];
        this._workersById = {};
        this._workers = {};
        this._pending = {};
        this._completed = {};
        this._listeners = {};
        this._errors = {};
        this._jobStore = new JobResultStore<RemoteJobResult>();
        if (config.startServer) {
            this._server = new OrchestratorServer(this);
        }
        this._strategy = DispatchStrategy.createFromType(
            config.strategy || DispatchStrategyType.ROUND_ROBIN
        );
    }

    public register(address: string, worker: RemoteWorker) {
        this._workers[address] = worker;
        this._workersById[worker.id] = worker;

        const newWorkers = _.filter(this.__workers, value => {
            return value.address !== address;
        });

        newWorkers.push(worker);
        this.__workers = newWorkers;
        this._strategy.workers = newWorkers;
    }

    public unregister(address: string, id: string) {
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

    public schedule(name: string, params?: any, listener?: JobListener) {
        this.LOGGER.info("info", "Scheduling..");
        let remote = -1;
        let cycle = 0;
        while (remote === -1 && cycle < this.__workers.length) {
            const pick = this._strategy.pick();
            remote = pick.jobs.indexOf(name);
            cycle += 1;
        }
        if (remote === -1) {
            return {message: "no suitable node found"};
        } else {
            const worker = this.__workers[remote];
            this.LOGGER.info("Selected: ", worker);
            const api = `${worker.address}/worker/schedule`;
            request.post(
                api,
                {json: {name, params}},
                (error, response, body) => {
                    if (!error && response.statusCode === 200) {
                        const id = response.body.message;
                        this.LOGGER.info(
                            `Successfully Scheduled ${id} to Node at ${
                                worker.address
                                }`
                        );
                        this.pend(id, worker);
                        listener = listener ? listener : null;
                        this._listeners[id] = listener;
                        this.LOGGER.debug(" Pending", this._pending);
                    } else {
                        this.LOGGER.error(
                            `Error Scheduling to Node at ${worker.address}: `,
                            body
                        );
                    }
                }
            );
        }
    }

    public pend(id: string, worker: RemoteWorker) {
        this._pending[id] = {worker: worker.id};
    }

    public complete(worker: string, job: string, result: any) {
        this.LOGGER.info(`Job ${job} from remote worker ${worker} finished`);
        const listener = this._listeners[job];
        if (listener) {
            listener.onJobCompleted(result);
        }
        const pending = this._pending[job];
        if (pending.worker === worker) {
            delete this._pending[job];
            this._completed[job] = {worker};
            this._jobStore.push({
                data: result,
                id: job,
                worker,
            });
        }
    }

    public error(worker: string, job: string, result: any) {
        this.LOGGER.info(
            `Job ${job} from remote worker ${worker} finished with an error`
        );
        const listener = this._listeners[job];
        if (listener) {
            listener.onJobError(result);
        }
        const pending = this._pending[job];
        if (pending.worker === worker) {
            delete this._pending[job];
            this._errors[job] = {worker, error: result};
            this._jobStore.push({
                data: result,
                error: true,
                id: job,
                worker
            });
        }
    }

    public get all() {
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

    public get completed() {
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

    public get errored() {
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

    public get pending() {
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

    public status(id: string) {
        const pending = this._pending[id];
        const res = !pending ? this._completed[id] : pending;
        const err = this._errors[id];
        if (err) {
            return {
                status: "error",
                worker: err.worker
            };
        } else {
            return {
                status: pending ? "pending" : res ? "done" : "unknown",
                worker: res ? res.worker : "unknown"
            };
        }
    }

    public fetch(id: string) {
        return this.isComplete(id) ? this._jobStore.fetch(id) : undefined;
    }

    public get(id: string) {
        return this.isComplete(id) ? this._jobStore.get(id) : undefined;
    }

    private isComplete(id: string) {
        return !!this._completed[id] || !!this._errors[id];
    }

    get workers(): { [p: string]: RemoteWorker } {
        return this._workers;
    }

    get listeners(): { [p: string]: JobListener } {
        return this._listeners;
    }

    get jobStore(): JobResultStore<RemoteJobResult> {
        return this._jobStore;
    }

    get workerslist(): RemoteWorker[] {
        return this.__workers;
    }

    get idworkers(): { [p: string]: RemoteWorker } {
        return this._workersById;
    }

    get strategy(): DispatchStrategy {
        return this._strategy;
    }
}
