import * as _ from "lodash";

interface JobStoreConfig {
    jobs: { [key: string]: any; }
}

export class JobStore {

    private _jobs: { [key: string]: any; };
    private _jobnames: string[];

    constructor(config: JobStoreConfig) {
        this._jobs = config.jobs;
        this._jobnames = [];
        _.forEach(this._jobs, (value, key) => {
            this.register(key, value);
        })
    }

    public createFromName<T>(name: string, params?: any): T {
        const type = this._jobs[name];
        if (type) {
            return this.create(name, type, params);
        }
    }

    public register<T>(name: string, type: T) {
        this._jobs[name] = type;
        this._jobnames.push(name);
    }

    private create<T>(name: string, type: (new (name, params?) => T), params: any): T {
        return new type(name, params);
    }

    get jobs() {
        return this._jobnames;
    }
}