"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const winston = require("winston");
class RemoteOrchestrator {
    constructor(address) {
        this.LOGGER = winston.loggers.get("RemoteOrchestrator");
        this._address = address;
    }
    connect(options, cb, err) {
        request.post(`${this._address}/orchestrator/register`, { json: options }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                this._remoteId = response.toJSON().body.id;
                this.LOGGER.info(`Successfully registered to hub at ${this._address} recieved id: ${this._remoteId}`);
                if (cb) {
                    cb(response, body);
                }
            }
            else {
                err(error, response, body);
            }
        });
    }
    disconnect(options, cb, err) {
        request.post(`${this._address}/orchestrator/disconnect`, { json: options }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                this._remoteId = response.toJSON().body.id;
                this.LOGGER.info(`Successfully disconnected frp, hub at ${this._address}`);
                if (cb) {
                    cb(response, body);
                }
            }
            else {
                err(error, response, body);
            }
        });
    }
    notifyComplete(jresponse, cb, err) {
        request.post(`${this._address}/orchestrator/job/complete`, { json: jresponse }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                if (cb) {
                    cb(response, body);
                }
            }
            else {
                err(error, response, body);
            }
        });
    }
    get remoteId() {
        return this._remoteId;
    }
}
exports.RemoteOrchestrator = RemoteOrchestrator;
