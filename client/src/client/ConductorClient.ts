import {RequestCallback} from "request";
import * as request from "request-promise";
import * as winston from "winston";
import {ConnectionResponse, JobReport, JobResultResponse, RemoteJobStatus} from "..";

export interface RemoteJobResult extends Result {
    worker: string;
    error?: boolean;
}

export interface JobResult extends Result {
    name: string;
}

export interface Result {
    id: string;
    data: any;
}

export interface RemoteJobStatus {
    id?: string;
    status: string;
    worker: string;
}

export interface JobReport {
    jobs: RemoteJobStatus[];
}

export interface ConnectionResponse {
    message: string;
    id?: string;
}


export interface JobResultResponse {
    data: JobResult;
    message: string;
}

export interface ClientOrchestrator {
    address: string;
    health: string;
    jobs: string;
    done: string;
    pending: string;
    status: (id: string) => string;
    result: (id: string) => string;
    check: (id: string) => string;
}

export interface ClientConfig {
    address: string;
}

const generate = (address: string) => {
    return {
        address,
        check: (job: string) => `${address}/orchestrator/job/${job}/check`,
        done: `${address}/orchestrator/job/done`,
        health: `${address}/orchestrator/health`,
        jobs: `${address}/orchestrator/job/`,
        pending: `${address}/orchestrator/job/pending`,
        result: (job: string) => `${address}/orchestrator/job/${job}/result`,
        status: (job: string) => `${address}/orchestrator/job/${job}`
    };
};

export class ConductorClient {
    private readonly LOGGER = winston.loggers.get("ConductorClient");
    private readonly _config: ClientConfig;
    private _remote: ClientOrchestrator;

    constructor(config: ClientConfig) {
        this._config = config;
    }

    public async start() {
        await this.add(this._config.address);
        return this;
    }

    public async add(address: string): Promise<ConnectionResponse> {
        const orch: ClientOrchestrator = generate(address);
        return await this.connect(orch);
    }

    public remove(address: string) {
        this.LOGGER.info(`Removing ${address}`);
        this._remote = null;
    }

    public get connected() {
        return !!this._remote;
    }

    public async check(id: string): Promise<JobResultResponse> {
        return await this.get<JobResultResponse>(
            this._remote.check(id),
            this.createCallback(this._remote.check(id))
        );
    }

    public async done(): Promise<JobReport> {
        return await this.get<JobReport>(
            this._remote.done,
            this.createCallback(this._remote.done)
        );
    }

    public async health(): Promise<ConnectionResponse> {
        return await this.get<ConnectionResponse>(
            this._remote.health,
            this.createCallback(this._remote.health)
        );
    }

    public async jobs(): Promise<JobReport> {
        return await this.get<JobReport>(
            this._remote.jobs,
            this.createCallback(this._remote.jobs)
        );
    }

    public async pending(): Promise<JobReport> {
        return await this.get<JobReport>(
            this._remote.pending,
            this.createCallback(this._remote.pending)
        );
    }

    public async result(id: string): Promise<JobResultResponse> {
        return await this.get<JobResultResponse>(
            this._remote.result(id),
            this.createCallback(this._remote.result(id))
        );
    }

    public async status(id: string): Promise<RemoteJobStatus> {
        return await this.get<RemoteJobStatus>(
            this._remote.status(id),
            this.createCallback(this._remote.status(id))
        );
    }

    private async connect(orch: ClientOrchestrator): Promise<ConnectionResponse> {
        if (this._remote && this._remote.address !== orch.address) {
            this.LOGGER.info(`${orch.address} already connected`);
            return {message: "up"};
        } else {
            return await this.get<ConnectionResponse>(
                orch.health,
                this.createCallback(orch.health, (error, response) => {
                    if (!error && response.statusCode === 200) {
                        this._remote = orch;
                        this.LOGGER.info(`Added`);
                    }
                })
            );
        }
    }

    private createCallback(url: string, cb?: RequestCallback) {
        return (error, response, body) => {
            if (!error && response.statusCode === 200) {
                this.LOGGER.info(`Successfully Called ${url}`);
            } else {
                this.LOGGER.warn(`Failed to Find Orchestrator at ${url}`);
            }
            if (cb) {
                cb(error, response, body);
            }
        };
    }

    private async get<T>(url: string, cb: RequestCallback): Promise<T> {
        return await request.get(url, cb);
    }

    private async post<T>(url: string, data: any, cb: RequestCallback) {
        return await request.post(url, {json: data}, cb);
    }
}
