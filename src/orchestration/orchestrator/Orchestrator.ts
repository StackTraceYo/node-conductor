import {RemoteWorker} from "../worker/RemoteWorker";
import {DispatchStrategy, DispatchStrategyType} from "../strategy/DispatchStrategy";
import * as request from "request";


export interface OrchestratorConfig {
    strategy: DispatchStrategyType
}

export class Orchestrator {

    private _workers: { [key: string]: RemoteWorker; };
    private __workers: RemoteWorker[];
    private _strategy: DispatchStrategy;

    constructor(config: OrchestratorConfig) {
        this._strategy = DispatchStrategy.createFromType(config.strategy || DispatchStrategyType.ROUND_ROBIN);
    }

    register(address: string, worker: RemoteWorker) {
        // todo clean workers
        this._workers[address] = worker;
        this.__workers.push(worker);
        // update workers in strategy
        this._strategy.workers = this.__workers;
    }

    schedule(name: string, params: any) {
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
            const api = `http://${worker.address}/schedule`;
            request.post(api, {json: {name: name, params: params}},
                (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(`Successfully Scheduled to Node at ${worker.address}`)
                    }
                })
        }
    }


}