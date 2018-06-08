import {Job, JobStore, WorkNode} from "../src";

class TestJob extends Job<string> {
    public async execute(): Promise<string> {
        this.emit("Executing Job");
        return new Promise<string>((resolve) => {
            // wait 3s before calling resolving
            setTimeout(() => resolve("Test Job Response"), 3000);
        });
    }
}

const worker = new WorkNode({
    address: "http://localhost",
    jobstore: new JobStore({
        jobs: {
            test: TestJob
        }
    }),
    orchestratorAddress: "http://localhost:8999",
    port: "8888"
});
