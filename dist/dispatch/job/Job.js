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
class Job extends events_1.EventEmitter {
    constructor(_name) {
        super();
        this._name = _name;
    }
    start(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(exports.START, id);
            this._running = true;
            this._id = id;
            this.emit(exports.EXEC);
            let res = yield this.run();
            this.emit(exports.END, res);
            this._result = res.data;
            this._completed = true;
            this._running = false;
            return res;
        });
    }
    getResult() {
        return this._result;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.execute().catch(error => this.emit(exports.ERROR, { error: error, id: this._id }));
            return {
                id: this._id,
                name: this._name,
                data: data
            };
        });
    }
}
exports.Job = Job;
//# sourceMappingURL=Job.js.map