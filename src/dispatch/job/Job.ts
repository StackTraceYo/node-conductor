import { EventEmitter } from "events";
import { JobResult } from "../../store/JobResultStore";

export const START = `[Job] Start`;
export const EXEC = `[Job] Executing`;
export const END = `[Job] End`;
export const ERROR = `[Job] Error`;

export interface JobError {
    id: string;
    error: any;
}

export type Listener = (arg: JobResult) => void;
export type ErrorListener = (error: JobError) => void;

export interface JobListener {
    onJobStarted?: Listener;
    onJobRunning?: Listener;
    onJobCompleted?: Listener;
    onJobError?: ErrorListener;
}

export abstract class Job<T> extends EventEmitter {
    private _running: boolean;
    private _completed: boolean;
    private _result: T;
    public _id;

    constructor(public _name: string) {
        super();
    }

    public async start(id: string): Promise<JobResult> {
        this.emit(START, id);
        this._running = true;
        this._id = id;
        this.emit(EXEC);
        let res = await this.run();
        this.emit(END, res);
        this._result = res.data;
        this._completed = true;
        this._running = false;
        return res;
    }

    public getResult() {
        return this._result;
    }

    private async run(): Promise<JobResult> {
        let data = await this.execute().catch(error =>
            this.emit(ERROR, { error: error, id: this._id })
        );
        return {
            id: this._id,
            name: this._name,
            data: data
        };
    }

    abstract async execute(): Promise<T>;

    async preRun() {
        return;
    }

    async postRun() {
        return;
    }
}
