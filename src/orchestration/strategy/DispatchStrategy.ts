import {RemoteWorker} from "../worker/RemoteWorker";

export enum DispatchStrategyType {
    ROUND_ROBIN
}

export abstract class DispatchStrategy {

    protected _workers: RemoteWorker[];

    constructor(workers?: RemoteWorker[]) {
        this._workers = workers || [];
    }

    public set workers(workers: RemoteWorker[]) {
        this._workers = workers;
    }

    public abstract pick(): RemoteWorker;

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

}