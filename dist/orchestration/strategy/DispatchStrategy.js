"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DispatchStrategyType;
(function (DispatchStrategyType) {
    DispatchStrategyType[DispatchStrategyType["ROUND_ROBIN"] = 0] = "ROUND_ROBIN";
})(DispatchStrategyType = exports.DispatchStrategyType || (exports.DispatchStrategyType = {}));
class DispatchStrategy {
    static createFromType(type) {
        switch (type) {
            case DispatchStrategyType.ROUND_ROBIN:
                return new RoundRobinDispatchStrategy();
            default:
                return undefined;
        }
    }
    constructor(workers) {
        this._workers = workers || [];
    }
}
exports.DispatchStrategy = DispatchStrategy;
class RoundRobinDispatchStrategy extends DispatchStrategy {
    constructor() {
        super(...arguments);
        this._current = 0;
    }
    pick() {
        const size = this._workers.length;
        const pick = size > 0 ? this._current % size : undefined;
        this._current += 1;
        return pick >= 0 ? this._workers[pick] : undefined;
    }
    get type() {
        return DispatchStrategyType.ROUND_ROBIN;
    }
    set workers(workers) {
        this._current = 0;
        this._workers = workers;
    }
    get workers() {
        return this._workers;
    }
}
exports.RoundRobinDispatchStrategy = RoundRobinDispatchStrategy;
