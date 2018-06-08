"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
exports.START = `[Job] Start`;
exports.EXEC = `[Job] Executing`;
exports.END = `[Job] End`;
exports.ERROR = `[Job] Error`;
exports.PRE = `[Job] Pre Run`;
exports.POST = `[Job] Post Run`;
class Job extends events_1.EventEmitter {
    constructor(_name) {
        super();
        this._name = _name;
    }
    start(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(exports.START, id);
            yield this.preRun();
            this._running = true;
            this._id = id;
            this.emit(exports.EXEC);
            const res = yield this.run();
            this.emit(exports.END, res);
            this._result = res.data;
            this._completed = true;
            this._running = false;
            yield this.postRun();
            return res;
        });
    }
    getResult() {
        return this._result;
    }
    preRun() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(exports.PRE);
        });
    }
    postRun() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(exports.POST);
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.execute().catch((error) => __awaiter(this, void 0, void 0, function* () {
                this.emit(exports.ERROR, { error, id: this._id });
                this._completed = true;
                this._running = false;
                this._result = error;
                yield this.postRun();
            }));
            return {
                id: this._id,
                name: this._name,
                data
            };
        });
    }
}
exports.Job = Job;
