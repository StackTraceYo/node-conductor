import {JobResult} from "../dispatch/job/Job";

export class JobResultStore {

    private readonly _finishedData: { [key: string]: JobResult; };

    constructor() {
        this._finishedData = {};
    }

    public push(result: JobResult) {
        this._finishedData[result.id] = result.data;
    }

    public fetch(id: string) {
        return this._finishedData[id];
    }

    public get(id: string) {
        const res = this._finishedData[id];
        res ? delete this._finishedData[id] : res;
        return res;
    }
}