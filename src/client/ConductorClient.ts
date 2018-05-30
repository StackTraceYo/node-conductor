import * as request from "request";
import {RequestCallback} from "request";
import * as winston from "winston";

export interface ClientOrchestrator {
    address: string,
    health: string,
    jobs: string,
    done: string,
    pending: string,
    status: (id: string) => string,
    result: (id: string) => string,
    check: (id: string) => string
}

export interface ClientConfig {
    address: string
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
    }
};

export class ConductorClient {

    private readonly LOGGER = winston.loggers.get("ConductorClient");
    private readonly _config: ClientConfig;
    private _remote: ClientOrchestrator;

    constructor(config: ClientConfig) {
        this._config = config;
        this.add(config.address);
    }

    public add(address: string) {
        if (this._remote.address !== address) {
            const orch: ClientOrchestrator = generate(address);
            this.connect(orch);
        } else {
            this.LOGGER.info(
                `${address} already connected`
            );
        }
    }

    public remove(address: string) {
        this.LOGGER.info(
            `Removing ${address}`
        );
        this._remote = null;
    }

    public get connected() {
        return !!this._remote;
    }

    public check(id: string, cb?: RequestCallback) {
        this.get(this._remote.check(id), this.createCallback(this._remote.check(id), cb));
    }

    public done(cb?: RequestCallback) {
        this.get(this._remote.done, this.createCallback(this._remote.done, cb));
    }

    public health(cb?: RequestCallback) {

        this.get(this._remote.health, this.createCallback(this._remote.health, cb));
    }

    public jobs(cb?: RequestCallback) {
        this.get(this._remote.jobs, this.createCallback(this._remote.jobs, cb));
    }

    public pending(cb?: RequestCallback) {
        this.get(this._remote.pending, this.createCallback(this._remote.pending, cb));
    }

    public result(id: string, cb?: RequestCallback) {
        this.get(this._remote.result(id), this.createCallback(this._remote.result(id), cb));
    }

    public status(id: string, cb?: RequestCallback) {
        this.get(this._remote.status(id), this.createCallback(this._remote.status(id), cb));
    }


    private connect(orch: ClientOrchestrator) {
        this.get(
            orch.health,
            this.createCallback(orch.health, (error, response) => {
                if (!error && response.statusCode === 200) {
                    this._remote = orch
                }
            })
        );
    }

    private createCallback(url: string, cb?: RequestCallback) {
        return (error, response, body) => {
            if (!error && response.statusCode === 200) {
                this.LOGGER.info(
                    `Successfully Called ${url}, adding`
                );
            } else {
                this.LOGGER.warning(
                    `Failed to Find Orchestrator at ${url}`
                );
            }
            if (cb) {
                cb(error, response, body);
            }
        }
    }

    private get(url: string, cb: RequestCallback) {
        return request.get(
            url,
            cb
        );
    }

    private post(url: string, data: any, cb: RequestCallback) {
        return request.post(
            url,
            {json: data},
            cb
        );
    }
}