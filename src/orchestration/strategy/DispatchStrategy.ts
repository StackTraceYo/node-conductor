import {RemoteWorker} from "../worker/RemoteWorker";

export enum DispatchStrategyType {
    ROUND_ROBIN
}

export abstract class DispatchStrategy {

    protected _workers: RemoteWorker[];

    constructor(workers?: RemoteWorker[]) {
        this._workers = workers || [];
    }

    public abstract set workers(workers: RemoteWorker[]);

    public abstract get workers(): RemoteWorker[];

    public abstract pick(): RemoteWorker;

    public abstract get type(): DispatchStrategyType;

    public static createFromType(type: DispatchStrategyType) {
        switch (type) {
            case DispatchStrategyType.ROUND_ROBIN:
                return new RoundRobinDispatchStrategy();
        }
    }

}

export class RoundRobinDispatchStrategy extends DispatchStrategy {

    private _current = 0;

    pick(): RemoteWorker {
        let size = this._workers.length;
        let pick = size > 0 ? this._current % size : undefined;
        this._current += 1;
        return pick >= 0 ? this._workers[pick] : undefined
    }

    get type(): DispatchStrategyType {
        return DispatchStrategyType.ROUND_ROBIN;
    }

    public set workers(workers: RemoteWorker[]) {
        this._current = 0;
        this._workers = workers;
    }


    public get workers(): RemoteWorker[] {
        return this._workers;
    }
}