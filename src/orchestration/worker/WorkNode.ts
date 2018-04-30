import {Dispatcher, DispatcherConfig} from "../../dispatch/dispatcher/Dispatcher";
import * as _ from "lodash";
import * as request from "request"

export interface WorkNodeConfig {
    jobs: string[],
    dispatchConfig?: DispatcherConfig,
    hubs: string[],
    address?: string
    port?: string
}

export class WorkNode {

    private _hubs: string[];
    private _jobs: string[];
    private _dispatcher: Dispatcher;

    constructor(config: WorkNodeConfig) {
        this._hubs = config.hubs;
        this._jobs = config.jobs;
        this._dispatcher = new Dispatcher(config.dispatchConfig);
        let remote = {
            jobs: this._jobs,
            address: config.address,
            port: config.port
        };
        this.init(remote);
    }

    private init(data: any) {

        _.forEach(this._hubs, (hub: string) => {
            request.post(`${hub}/hub/register`, {json: data},
                (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(`Successfully registered to hub at ${hub}`)
                    }
                }
            )
        })

    }
}