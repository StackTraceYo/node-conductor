import {Queue} from "../../util/queue/Queue";
import {END, ERROR, EXEC, Job, JobListener, JobResult, START} from "../job/Job";
import {v4 as uuid} from 'uuid';
import _ = require("lodash");
import Timer = NodeJS.Timer;

type NamedJob = [string, Job<any>]

export enum JobStatus {
    Queued,
    Starting,
    Running,
    Completed,
    Failed,
    Unknown,
    None
}

export interface DispatcherConfig {
    concurrent?: number,
    cycle?: number
    idleCycle?: number,
    idleCycleCount?: number;
    manualMode?: boolean;
}

const defaultConfig: DispatcherConfig = {
    concurrent: 3,
    cycle: 5000,
    idleCycle: 20000,
    idleCycleCount: 10,
    manualMode: false
};

export class Dispatcher {

    private _jobQueue: Queue<NamedJob>;
    private _running: { [key: string]: Job<any>; };
    private _completed: string[];
    private _listeners: { [key: string]: JobListener; };
    private _numberRunning: number;
    private _maxConcurrent: number;
    private _cycleTime: number;
    private _idleCycleTime: number;
    private _idle: boolean;
    private _idleCycles: number;
    private _idleCycleCount: number;
    private _timeoutHandle: Timer;
    private _cycleOff: boolean;

    constructor(config?: DispatcherConfig) {
        this._jobQueue = new Queue<NamedJob>();
        this._numberRunning = 0;
        this._idle = false;
        this._idleCycles = 0;
        this._running = {};
        this._listeners = {};
        this._completed = [];
        let configuration = {...defaultConfig, ...config};
        console.log(configuration);
        this._maxConcurrent = configuration.concurrent;
        this._cycleTime = configuration.cycle;
        this._idleCycleTime = configuration.idleCycle;
        this._idleCycleCount = configuration.idleCycleCount;
        this._cycleOff = configuration.manualMode;
        if (!this._cycleOff) {
            this.cycle();
        }
    }

    public schedule(job: Job<any>, listener?: JobListener): string {
        this._idleCycles = 0;
        this._idle = false;
        const id = uuid();
        listener = listener ? listener : null;
        this._listeners[id] = listener;
        this._jobQueue.enqueue([id, job]);
        if (!this._cycleOff && this._timeoutHandle) {
            clearTimeout(this._timeoutHandle);
            this.cycle();
        }
        return id;
    }

    public attachListener(id: string, listener: JobListener) {
        if (this.isComplete(id)) {
            return "Unable to Attach To Completed Job";
        } else {
            if (this._listeners[id]) {
                return "Listener Already Bound"
            } else {
                this._listeners[id] = listener;
            }
        }
    }

    private cycle() {
        if (!this._cycleOff) {
            console.log("Checking..");
            if (this.jobsQueued() > 0) {
                console.log("Queued..");
                let slotsRemaining = this._maxConcurrent - this._numberRunning;
                while (slotsRemaining > 0) {
                    // consume
                    let consumed = this.consume();
                    slotsRemaining--;
                }
                this._timeoutHandle = setTimeout(() => this.cycle(), this._cycleTime);
            }
            else if (this._idle) {
                console.log("Idle..");
                this._timeoutHandle = setTimeout(() => this.cycle(), this._idleCycleTime);
            }
            else {
                console.log(`No jobs Queued.. ${this._idleCycles}`);
                this._idleCycles += 1;
                if (this._idleCycles >= this._idleCycleCount) {
                    console.log("Idling..");
                    this._idle = true;
                    this._timeoutHandle = setTimeout(() => this.cycle(), this._idleCycleTime);
                } else {
                    this._timeoutHandle = setTimeout(() => this.cycle(), this._cycleTime);
                }
            }
        }
    }

    public consume() {
        console.log(`Running -> ${this._numberRunning}\n Queued -> ${this.jobsQueued()}`)
        let queued: NamedJob = this._jobQueue.dequeue();
        if (queued) { //if queue has something
            const id = queued[0]; //job id
            const job = queued[1]; //job
            this.bind(id, job); //bind event listeners
            this._running[id] = job;
            return job.start(id); //start
        }
    }

    public jobsRunning() {
        return this._numberRunning;
    }

    public jobsQueued() {
        return this._jobQueue.length();
    }

    public getStatus(id: string): JobStatus {
        if (this.isComplete(id)) {
            return JobStatus.Completed
        } else if (this.isRunning(id)) {
            return JobStatus.Running
        }
        else if (this.isQueued(id)) {
            return JobStatus.Queued
        } else {
            return JobStatus.Unknown
        }
    }

    private isComplete(id: string) {
        return _.includes(this._completed, id)
    }

    private isRunning(id: string) {
        return !!this._running[id];
    }

    private isQueued(id: string) {
        return (!this.isRunning(id) //not running
            && !this.isComplete(id) //not complete
            //listener is defined  or null means key exists
            && (this._listeners[id] || this._listeners[id] === null))
    }

    private bind(id: string, job: Job<any>) {
        job.on(START, this.startListener);
        job.on(END, this.endListener);
        job.on(ERROR, this.errorListener);
        const listener = this._listeners[id];
        if (listener) {
            if (listener.onJobStarted) {
                job.on(START, listener.onJobStarted);
            }
            if (listener.onJobRunning) {
                job.on(EXEC, listener.onJobRunning);
            }
            if (listener.onJobCompleted) {
                job.on(END, listener.onJobCompleted);
            }
            if (listener.onJobError) {
                job.on(ERROR, listener.onJobError);
            }
        }
    }

    private startListener = (job: string) => {
        console.log(`Job ${job} Was Started`);
        this._numberRunning++;
    };

    private errorListener = (error) => {
        console.log(`Job ${error.id} Failed`);
        console.log(`${error.error}`);
        this._numberRunning--;
    };

    private endListener = (returnValue: JobResult) => {
        console.log(`Job ${returnValue.id} Finished`);
        this._numberRunning--;
        //set value to completed
        this._completed.push(returnValue.id);
        //remove from running
        delete this._running[returnValue.id];
        console.log(`Running -> ${this._numberRunning}\n Queued -> ${this.jobsQueued()}`)
    };
}