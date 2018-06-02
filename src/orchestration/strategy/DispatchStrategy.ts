import { RemoteWorker } from "../..";

export enum DispatchStrategyType {
    ROUND_ROBIN
}

export abstract class DispatchStrategy {
    public static createFromType(type: DispatchStrategyType) {
        switch (type) {
            case DispatchStrategyType.ROUND_ROBIN:
                return new RoundRobinDispatchStrategy();
            default:
                return undefined;
        }
    }

    protected _workers: RemoteWorker[];

    constructor(workers?: RemoteWorker[]) {
        this._workers = workers || [];
    }

    public abstract set workers(workers: RemoteWorker[]);

    public abstract get workers(): RemoteWorker[];

    public abstract pick(): RemoteWorker;

    public abstract get type(): DispatchStrategyType;
}

export class RoundRobinDispatchStrategy extends DispatchStrategy {
    private _current = 0;

    public pick(): RemoteWorker {
        const size = this._workers.length;
        const pick = size > 0 ? this._current % size : undefined;
        this._current += 1;
        return pick >= 0 ? this._workers[pick] : undefined;
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
