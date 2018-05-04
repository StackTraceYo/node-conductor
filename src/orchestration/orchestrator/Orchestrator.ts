import {RemoteWorker} from "../worker/RemoteWorker";
import {DispatchStrategy, DispatchStrategyType} from "../strategy/DispatchStrategy";
import * as request from "request";
import * as _ from "lodash";
import {OrchestratorServer} from "./OrchestratorServer";
import {JobListener} from "../../dispatch/job/Job";


export interface OrchestratorConfig {
    strategy: DispatchStrategyType
}

export class Orchestrator {

    // registered workers
    private readonly _workers: { [key: string]: RemoteWorker; };
    // job completion listeners
    private readonly _listeners: { [key: string]: JobListener; };
    // pending ids and thair worker
    private readonly _pending: {
        [key: string]: {
            worker: string,
        }
    };
    // completed jobs their works and the result
    private readonly _completed: {
        [key: string]: {
            worker: string,
            result: any
        }
    };
    // array of workers
    private __workers: RemoteWorker[];
    private _strategy: DispatchStrategy;
    //server
    private _server: OrchestratorServer;


    constructor(config: OrchestratorConfig) {
        this.__workers = [];
        this._workers = {};
        this._pending = {};
        this._listeners = {};
        this._completed = {};
        this._server = new OrchestratorServer(this);
        this._strategy = DispatchStrategy.createFromType(config.strategy || DispatchStrategyType.ROUND_ROBIN);
    }

    register(address: string, worker: RemoteWorker) {
        this._workers[address] = worker;
        let newWorkers = _.filter(this.__workers, value => {
            return value.address !== address;
        });

        newWorkers.push(worker);
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
                        console.log(`Successfully Scheduled to Node at ${worker.address}`);
                        let id = response.toJSON().body.id;
                        this._pending[id] = {worker: worker.id};
                        listener = listener ? listener : null;
                        this._listeners[id] = listener;
                    } else {
                        console.log(`Error Scheduling to Node at ${worker.address}: `, body)
                    }
                })
        }
    }

    complete(worker: string, job: string, result: any) {
        console.log(`Job ${job} from remote worker ${worker} finished`);
        const listener = this._listeners[job];
        listener ? listener.onJobCompleted(result) : null;
        delete this._pending[job];
        this._completed[job] = {
            worker: worker,
            result: result
        }
    }

    public get jobs() {
        const pending = _.map(this._pending, (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: 'pending'
                }
            }
        );

        const completed = _.map(this._completed, (value, key) => {
                return {
                    id: key,
                    worker: value.worker,
                    status: 'done'
                }
            }
        );

        return {
            jobs: completed.concat(pending)
        }
    }

    public status(id: string) {
        const pending = this._pending[id];
        const res = !pending ? this._completed[id] : pending;
        return {
            status: pending ? 'pending' : res ? 'done' : 'unknown',
            worker: res ? res.worker : 'unknown'
        }
    }


    public fetch(id: string) {
        return this.isComplete(id) ? this._completed[id] : undefined;
    }

    private isComplete(id: string) {
        return !!this._completed[id];
    }
}