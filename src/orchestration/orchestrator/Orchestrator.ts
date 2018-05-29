import {RemoteWorker} from "../worker/RemoteWorker";
import {DispatchStrategy, DispatchStrategyType} from "../strategy/DispatchStrategy";
import * as request from "request";
import * as _ from "lodash";
import {OrchestratorServer} from "./OrchestratorServer";
import {JobListener} from "../../dispatch/job/Job";
import {JobResultStore} from "../../store/JobResultStore";


export interface OrchestratorConfig {
    strategy: DispatchStrategyType,
    startServer: boolean
}

export class Orchestrator {

    // registered workers
    private readonly _workers: { [key: string]: RemoteWorker; };
    private readonly _workersById: { [key: string]: RemoteWorker; };
    // job completion listeners
    private readonly _listeners: { [key: string]: JobListener; };

    // pending ids and their worker
    private readonly _pending: {
        [key: string]: {
            worker: string,
        }
    };

    // completed jobs their works and the result
    private readonly _completed: {
        [key: string]: {
            worker: string
        }
    };

    private readonly _errors: {
        [key: string]: {
            worker: string,
            error: any
        }
    };

    private readonly _jobStore: JobResultStore;

    // array of workers
    private __workers: RemoteWorker[];
    private _strategy: DispatchStrategy;
    //server
    private _server: OrchestratorServer;


    constructor(config: OrchestratorConfig) {
        this.__workers = [];
        this._workersById = {};
        this._workers = {};
        this._pending = {};
        this._completed = {};
        this._listeners = {};
        this._errors = {};
        this._jobStore = new JobResultStore();
        if (config.startServer) {
            this._server = new OrchestratorServer(this);
        }
        this._strategy = DispatchStrategy.createFromType(config.strategy || DispatchStrategyType.ROUND_ROBIN);
    }

    register(address: string, worker: RemoteWorker) {
        this._workers[address] = worker;
        this._workersById[worker.id] = worker;

        let newWorkers = _.filter(this.__workers, value => {
            return value.address !== address;
        });

        newWorkers.push(worker);
        this.__workers = newWorkers;
        this._strategy.workers = newWorkers;
    }

    unregister(address: string, id: string) {
        let unregistering = this._workers[address];
        if (unregistering) {
            delete this._workersById[unregistering.id];
            delete this._workers[address]
        }
        let newWorkers = _.filter(this.__workers, value => {
            return value.address !== address;
        });
        this.__workers = newWorkers;
        this._strategy.workers = newWorkers;
    }

    schedule(name: string, params?: any, listener?: JobListener) {
        console.log('Scheduling..');
        let remote = -1;
        let cycle = 0;
        while (remote === -1 && cycle < this.__workers.length) {
            let pick = this._strategy.pick();
            remote = pick.jobs.indexOf(name);
            cycle += 1;
        }
        if (remote === -1) {
            return {message: 'no suitable node found'}
        }
        else {
            const worker = this.__workers[remote];
            console.log('Selected: ', worker);
            const api = `${worker.address}/worker/schedule`;
            request.post(api, {json: {name: name, params: params}},
                (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        let id = response.body.message;
                        console.log(`Successfully Scheduled ${id} to Node at ${worker.address}`);
                        this.pend(id, worker);
                        listener = listener ? listener : null;
                        this._listeners[id] = listener;
                        console.log(this._pending)
                    } else {
                        console.log(`Error Scheduling to Node at ${worker.address}: `, body)
                    }
                })
        }
    }

    pend(id: string, worker: RemoteWorker) {
        this._pending[id] = {worker: worker.id};
    }

    complete(worker: string, job: string, result: any) {
        console.log(`Job ${job} from remote worker ${worker} finished`);
        const listener = this._listeners[job];
        listener ? listener.onJobCompleted(result) : null;
        let pending = this._pending[job];
        if (pending.worker === worker) {
            delete this._pending[job];
            this._completed[job] = {worker: worker};
            this._jobStore.push(
                {
                    id: job,
                    worker: worker,
                    data: result
                }
            );
        }
    }

    error(worker: string, job: string, result: any) {
        console.log(`Job ${job} from remote worker ${worker} finished with an error`);
        const listener = this._listeners[job];
        listener ? listener.onJobError(result) : null;
        let pending = this._pending[job];
        if (pending.worker === worker) {
            delete this._pending[job];
            this._errors[job] = {worker: worker, error: result};
            this._jobStore.push(
                {
                    id: job,
                    worker: worker,
                    data: result,
                    error: true
                }
            );
        }
    }

    public get all() {
        const pending = _.map(this._pending, (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: 'pending'
                }
            }
        );

        const completed = _.map(this._jobStore.jobResults(), (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: value.error ? 'error' : 'done'
                }
            }
        );

        return {
            jobs: _.unionBy(pending, completed, "id")
        }
    }

    public get completed() {

        const completed = _.map(this._jobStore.jobResults(), (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: value.error ? 'error' : 'done'
                }
            }
        );

        return {
            jobs: completed
        }
    }

    public get errored() {

        const completed = _.map(this._jobStore.jobResults(), (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: value.error ? 'error' : 'done'
                }
            }
        );

        return {
            jobs: _.filter(completed, value => value.status === 'error')
        }
    }

    public get pending() {
        const pending = _.map(this._pending, (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: 'pending'
                }
            }
        );
        return {
            jobs: pending
        }
    }

    public status(id: string) {
        const pending = this._pending[id];
        const res = !pending ? this._completed[id] : pending;
        const err = this._errors[id];
        if (err) {
            return {
                status: 'error',
                worker: err.worker
            }
        } else {
            return {
                status: pending ? 'pending' : res ? 'done' : 'unknown',
                worker: res ? res.worker : 'unknown'
            }
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

    get jobStore(): JobResultStore {
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