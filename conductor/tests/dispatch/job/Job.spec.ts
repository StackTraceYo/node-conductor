import {expect} from "chai";
import "mocha";
import * as sinon from "sinon";
import {END, EXEC, Job, JobResult, POST, PRE, START} from "../../../src";

class TestJob extends Job<string> {
    public async execute(): Promise<string> {
        this.emit("Executing Job");
        return "Job Return Value";
    }

    public async preRun(): Promise<void> {
        return super.preRun();
    }

    public async postRun(): Promise<void> {
        return super.postRun();
    }
}

describe("Job", () => {
    it("should be created", () => {
        const result = new TestJob("test-job-name");
        expect(result).to.not.equal(null);
    });

    it("should emit Start Event", () => {
        const job = new TestJob("test-job-name");

        const spy = sinon.spy();
        job.on(START, spy);

        job.start("test");
        sinon.assert.calledOnce(spy);
    });

    it("should emit Executing Event", () => {
        const job = new TestJob("test-job-name");

        const spy = sinon.spy();
        job.on(EXEC, spy);

        return job.start("test").then(() => {
            sinon.assert.calledOnce(spy);
        })
    });

    it("should emit Ending Event", () => {
        const job = new TestJob("test-job-name");

        const spy = sinon.spy();
        job.on(END, spy);

        return job.start("test").then((result: JobResult) => {
            expect(result.data).to.equal("Job Return Value");
            sinon.assert.calledOnce(spy);
        });
    });

    it("should emit Running Event", () => {
        const job = new TestJob("test-job-name");

        const spy = sinon.spy();

        job.on("Executing Job", spy);

        job.start("test").then(() => {
            sinon.assert.calledOnce(spy);
        })
    });

    it("should emit Pre Run Event", () => {
        const job = new TestJob("test-job-name");

        const spy = sinon.spy();

        job.on(PRE, spy);

        job.start("test").then(() => {
            sinon.assert.calledOnce(spy);
        })
    });

    it("should emit Post Run Event", () => {
        const job = new TestJob("test-job-name");

        const spy = sinon.spy();

        job.on(POST, spy);

        job.start("test").then(() => {
            sinon.assert.calledOnce(spy);
        })
    });

    it("should emit all Events", () => {
        const job = new TestJob("test-job-name");

        const preSpy = sinon.spy();
        const startSpy = sinon.spy();
        const execSpy = sinon.spy();
        const runSpy = sinon.spy();
        const endSpy = sinon.spy();
        const postSpy = sinon.spy();

        job.on(START, startSpy);
        job.on(PRE, preSpy);
        job.on(EXEC, execSpy);
        job.on("Executing Job", runSpy);
        job.on(END, endSpy);
        job.on(POST, postSpy);

        return job.start("test").then(value => {
            sinon.assert.calledOnce(startSpy);
            sinon.assert.calledOnce(execSpy);
            sinon.assert.calledOnce(runSpy);
            sinon.assert.calledOnce(endSpy);
            // assert order
            sinon.assert.callOrder(startSpy, preSpy, execSpy, runSpy, endSpy, postSpy);
        });
    });

    it("should store and retrieve data value", () => {
        const job = new TestJob("test-job-name");

        return job.start("test").then(resolved => {
            expect(job.getResult()).equals("Job Return Value");
        });
    });
});
