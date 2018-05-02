import {Job} from "./dispatch/job/Job";
import {JobStore} from "./orchestration/store/JobStore";
import {WorkNode} from "./orchestration/worker/WorkNode";

class TestJob extends Job<String> {

    async execute(): Promise<string> {
        this.emit("Executing Job");
        console.log('TEST JOB');
        return "Job Return Value";
    }
}

const worker = new WorkNode({
    port: '8888',
    address: 'http://localhost',
    jobstore: new JobStore({
        jobs: {
            'test': TestJob
        }
    }),
    hub: 'http://localhost:8999'
});
