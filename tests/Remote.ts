import { Job } from "../src/dispatch/job/Job";
import { JobStore } from "../src/store/JobStore";
import { WorkNode } from "../src/orchestration/worker/WorkNode";

class TestJob extends Job<String> {
    async execute(): Promise<string> {
        this.emit("Executing Job");
        console.log("TEST JOB");
        return "Job Return Value";
    }
}

const worker = new WorkNode({
    port: "8888",
    address: "http://localhost",
    jobstore: new JobStore({
        jobs: {
            test: TestJob
        }
    }),
    orchestratorAddress: "http://localhost:8999"
});
