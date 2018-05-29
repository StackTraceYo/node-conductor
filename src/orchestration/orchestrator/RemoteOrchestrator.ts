import * as request from "request";

export class RemoteOrchestrator {


    private readonly _address: string;
    private _remoteId: string;


    constructor(address: string) {
        this._address = address;
    }


    public connect(options: any, cb?, err?) {
        request.post(`${this._address}/orchestrator/register`, {json: options},
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    this._remoteId = response.toJSON().body.id;
                    console.log(`Successfully registered to hub at ${this._address} recieved id: ${this._remoteId}`);
                    cb ? cb(response, body) : undefined;
                }
                else {
                    err(error, response, body);
                }
            }
        )
    }

    public disconnect(options: any, cb?, err?) {
        request.post(`${this._address}/orchestrator/disconnect`, {json: options},
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    this._remoteId = response.toJSON().body.id;
                    console.log(`Successfully disconnected frp, hub at ${this._address}`);
                    cb ? cb(response, body) : undefined;
                }
                else {
                    err(error, response, body);
                }
            }
        )
    }

    public notifyComplete(response: any, cb?, err?) {
        request.post(`${this._address}/orchestrator/job/complete`, {json: response},
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    cb ? cb(response, body) : undefined;
                } else {
                    err(error, response, body)
                }
            }
        )
    }

    public get remoteId() {
        return this._remoteId;
    }

}