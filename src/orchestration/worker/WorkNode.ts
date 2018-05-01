import {Dispatcher, DispatcherConfig} from "../../dispatch/dispatcher/Dispatcher";
import * as _ from "lodash";
import * as request from "request"
import {JobStore} from "../store/JobStore";
import {Job} from "../../dispatch/job/Job";
import {WorkNodeServer} from "./WorkNodeServer";

export interface WorkNodeConfig {
    jobstore: JobStore,
    dispatchConfig?: DispatcherConfig,
    hubs: string[],
    address?: string
    port?: string
}

export class WorkNode {

    private _hubs: string[];
    private _jobStore: JobStore;
    private _dispatcher: Dispatcher;
    private _server: WorkNodeServer;
    public _ids = {};

    constructor(public config: WorkNodeConfig) {
        this._hubs = config.hubs;
        this._jobStore = config.jobstore;
        this._dispatcher = new Dispatcher(config.dispatchConfig);
        this._server = new WorkNodeServer(this, {port: config.port});
        let remote = {
            jobs: this._jobStore.jobs,
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
                        this._ids[hub] = response.toJSON().body.id;
                        console.log(`Successfully registered to hub at ${hub} recieved id: ${this._ids[hub]}`);
                    }
                }
            )
        })

    }

    public schedule(name: string, params?: any) {
        let exists = this._jobStore.jobs.indexOf(name);
        if (exists > -1) {
            let job: Job<any> = this._jobStore.createFromName(name, params);
            return this._dispatcher.schedule(job);
        } else {
            return 'no job found'
        }
    }
}