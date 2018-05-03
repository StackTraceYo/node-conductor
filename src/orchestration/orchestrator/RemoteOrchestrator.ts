import * as request from "request";

export class RemoteOrchestrator {


    private readonly _address: string;
    private _remoteId: string;


    constructor(address: string) {
        this._address = address;
    }


    public connect(options: any, callback?, error?) {
        request.post(`${this._address}/orchestrator/register`, {json: options},
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    this._remoteId = response.toJSON().body.id;
                    console.log(`Successfully registered to hub at ${this._address} recieved id: ${this._remoteId}`);
                }
            }
        )
    }

    public notifyComplete(response: any, cb?, error?) {
        request.post(`${this._address}/orchestrator/job/complete`, {json: response},
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    // this._dispatcher.clean(arg.id);
                }
            }
        )
    }

}