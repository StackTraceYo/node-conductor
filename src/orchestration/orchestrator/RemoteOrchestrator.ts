import * as request from "request";
import * as winston from "winston";

export class RemoteOrchestrator {
    private readonly _address: string;
    private _remoteId: string;
    private LOGGER = winston.loggers.get("RemoteOrchestrator");

    constructor(address: string) {
        this._address = address;
    }

    public connect(options: any, cb?, err?) {
        request.post(
            `${this._address}/orchestrator/register`,
            {json: options},
            (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    this._remoteId = response.toJSON().body.id;
                    this.LOGGER.info(
                        `Successfully registered to hub at ${
                            this._address
                            } recieved id: ${this._remoteId}`
                    );
                    if (cb) {
                        cb(response, body)
                    }
                } else {
                    err(error, response, body);
                }
            }
        );
    }

    public disconnect(options: any, cb?, err?) {
        request.post(
            `${this._address}/orchestrator/disconnect`,
            {json: options},
            (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    this._remoteId = response.toJSON().body.id;
                    this.LOGGER.info(
                        `Successfully disconnected frp, hub at ${this._address}`
                    );
                    if (cb) {
                        cb(response, body)
                    }
                } else {
                    err(error, response, body);
                }
            }
        );
    }

    public notifyComplete(jresponse: any, cb?, err?) {
        request.post(
            `${this._address}/orchestrator/job/complete`,
            {json: jresponse},
            (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    if (cb) {
                        cb(response, body)
                    }
                } else {
                    err(error, response, body);
                }
            }
        );
    }

    public get remoteId() {
        return this._remoteId;
    }
}
