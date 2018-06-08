import {EventEmitter} from "events";
import {JobResult} from "../..";

export const START = `[Job] Start`;
export const EXEC = `[Job] Executing`;
export const END = `[Job] End`;
export const ERROR = `[Job] Error`;
export const PRE = `[Job] Pre Run`;
export const POST = `[Job] Post Run`;

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
    public _id;
    private _running: boolean;
    private _completed: boolean;
    private _result: T;

    public constructor(public _name: string) {
        super();
    }

    public async start(id: string): Promise<JobResult> {
        this.emit(START, id);
        await this.preRun();
        this._running = true;
        this._id = id;
        this.emit(EXEC);
        const res = await this.run();
        this.emit(END, res);
        this._result = res.data;
        this._completed = true;
        this._running = false;
        await this.postRun();
        return res;
    }

    public getResult() {
        return this._result;
    }

    public abstract async execute(): Promise<T>;

    public async preRun() {
        this.emit(PRE);
    }

    public async postRun() {
        this.emit(POST);
    }

    private async run(): Promise<JobResult> {
        const data = await this.execute().catch(async error => {
            this.emit(ERROR, {error, id: this._id});
            this._completed = true;
            this._running = false;
            this._result = error;
            await this.postRun();
        });
        return {
            id: this._id,
            name: this._name,
            data
        };
    }

}
