import {Dispatcher, DispatcherConfig} from "../../dispatch/dispatcher/Dispatcher";
import {JobStore} from "../../store/JobStore";
import {Job, JobListener} from "../../dispatch/job/Job";
import {WorkNodeServer} from "./WorkNodeServer";
import {RemoteOrchestrator} from "../orchestrator/RemoteOrchestrator";

export interface WorkNodeConfig {
    jobstore: JobStore,
    dispatchConfig?: DispatcherConfig,
    hub: string,
    address?: string
    port?: string
}

export class WorkNode {

    private _jobStore: JobStore;
    private _dispatcher: Dispatcher;
    private _server: WorkNodeServer;
    private _rOrch: RemoteOrchestrator;
    public _ids = {};
    private readonly _hub: string;

    constructor(public config: WorkNodeConfig) {
        this._hub = config.hub;
        this._jobStore = config.jobstore;
        this._dispatcher = new Dispatcher(config.dispatchConfig);
        this._server = new WorkNodeServer(this, {port: config.port});
        let remote = {
            jobs: this._jobStore.jobs,
            address: config.address,
            port: config.port
        };
        this._rOrch = new RemoteOrchestrator(this._hub);

        this.connectToOrchestrator(remote);
    }

    private connectToOrchestrator(data: any) {
        this._rOrch.connect(data);
    }

    public schedule(name: string, params?: any) {
        let exists = this._jobStore.jobs.indexOf(name);
        if (exists > -1) {
            let job: Job<any> = this._jobStore.createFromName(name, params);
            return this._dispatcher.schedule(job, this.jobCompletedListener());
        } else {
            return 'no job found'
        }
    }

    private jobCompletedListener: () => JobListener = () => {
        return {
            onJobCompleted: arg => {
                console.log('Job Completed');
                let response = {
                    jobId: arg.id,
                    worker: this._ids[this._hub],
                    result: arg.data
                };
                this._rOrch.notifyComplete(response);
            }
        };
    }
}