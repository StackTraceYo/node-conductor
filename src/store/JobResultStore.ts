import {JobResult} from "../dispatch/job/Job";

export interface RemoteJobResult {
    id: string
    worker: string
    data: any,
    error?: boolean
}


export class JobResultStore {

    private readonly _finishedData: { [key: string]: RemoteJobResult; };

    constructor() {
        this._finishedData = {};
    }

    public push(result: RemoteJobResult) {
        this._finishedData[result.id] = result;
    }

    public fetch(id: string) {
        return this._finishedData[id];
    }

    public get(id: string) {
        const res = this._finishedData[id];
        res ? delete this._finishedData[id] : res;
        return res;
    }

    public jobResults() {
        return this._finishedData;
    }
}