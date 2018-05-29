export interface RemoteJobResult extends Result {
    worker: string;
    error?: boolean;
}

export interface JobResult extends Result {
    name: string;
}

export interface Result {
    id: string,
    data: any
}

export class JobResultStore<T extends Result> {
    private readonly _finishedData: { [key: string]: T };

    constructor() {
        this._finishedData = {};
    }

    public push(result: T) {
        this._finishedData[result.id] = result;
    }

    public fetch(id: string) {
        return this._finishedData[id];
    }

    public get(id: string) {
        const res = this._finishedData[id];
        if (res) {
            delete this._finishedData[id];
        }
        return res;
    }

    public jobResults() {
        return this._finishedData;
    }
}