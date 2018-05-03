import * as request from "request";

export class RemoteWorker {

    private readonly _id: string;
    private readonly _address: string;
    private readonly _jobs: string[];


    constructor(id: string, address: string, jobs: string[]) {
        this._id = id;
        this._address = address;
        this._jobs = jobs;
    }

    public get jobs(): string[] {
        return this._jobs
    }

    public get id(): string {
        return this._id
    }

    public get address(): string {
        return this._address;
    }
}