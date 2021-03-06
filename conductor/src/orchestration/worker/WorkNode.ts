import {
    Dispatcher,
    DispatcherConfig,
    Job,
    JobError,
    JobListener,
    JobStore,
    RemoteOrchestrator
} from "../..";
import { WorkNodeServer } from "./WorkNodeServer";

export interface WorkNodeConfig {
    jobstore: JobStore;
    dispatchConfig?: DispatcherConfig;
    orchestratorAddress: string;
    address?: string;
    port?: string;
}

export class WorkNode {
    // job result data
    private _jobStore: JobStore;
    // job dispatcher
    private _dispatcher: Dispatcher;
    // server
    private _server: WorkNodeServer;
    // remote orchestrator reference
    private _remoteOrchestrator: RemoteOrchestrator;
    // orchestrator address
    private readonly _orchAddress: string;
    // worker node id from orchestrator
    private _id: string;

    constructor(public config: WorkNodeConfig) {
        this._orchAddress = config.orchestratorAddress;
        this._jobStore = config.jobstore;
        this._dispatcher = new Dispatcher(config.dispatchConfig);
        this._server = new WorkNodeServer(this, { port: config.port });
        const remote = {
            jobs: this._jobStore.jobs,
            address: config.address,
            port: config.port
        };
        this._remoteOrchestrator = new RemoteOrchestrator(this._orchAddress);
        this.connectToOrchestrator(remote);
    }

    private connectToOrchestrator(data: any) {
        this._remoteOrchestrator.connect(
            data,
            (r, b) => {
                this._id = r.toJSON().body.id;
            }
        );
    }

    public schedule(name: string, params?: any) {
        const exists = this._jobStore.jobs.indexOf(name);
        if (exists > -1) {
            const job: Job<any> = this._jobStore.createFromName(name, params);
            const id = this._dispatcher.schedule(
                job,
                this.jobCompletedListener()
            );
            return id;
        } else {
            return "no job found";
        }
    }

    private jobCompletedListener: () => JobListener = () => {
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
            onJobError: (arg: JobError) => {
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

    public get id() {
        return this._id;
    }

    public disconnect() {
        const remote = {
            address: this.config.address,
            port: this.config.port
        };
        this._remoteOrchestrator.disconnect(remote);
        this._id = undefined;
    }
}
