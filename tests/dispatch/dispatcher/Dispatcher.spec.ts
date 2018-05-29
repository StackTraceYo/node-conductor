import { expect } from "chai";
import "mocha";
import { Job, JobListener, JobResult } from "../../../src/dispatch/job/Job";
import {
    Dispatcher,
    JobStatus
} from "../../../src/dispatch/dispatcher/Dispatcher";
import * as sinon from "sinon";

class TestScheduledJob extends Job<String> {
    async execute(): Promise<string> {
        this.emit("Executing Job");
        return "Job Return Value";
    }
}

describe("Dispatcher", () => {
    it("should be created", () => {
        const sch = new Dispatcher({ manualMode: true });
        expect(sch).to.not.equal(null);
    });

    it("should be accept jobs", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");
        //
        let id1 = sch.schedule(job);
        let id2 = sch.schedule(job);
        let id3 = sch.schedule(job);
        expect(sch.jobsRunning()).to.equal(0);
        expect(sch.jobsQueued()).to.equal(3);

        expect(sch.getStatus(id1)).to.equal(JobStatus.Queued);
        expect(sch.getStatus(id2)).to.equal(JobStatus.Queued);
        expect(sch.getStatus(id3)).to.equal(JobStatus.Queued);
    });

    it("should be schedule and run a job", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");

        //force run
        let id1 = sch.schedule(job);
        return sch.consume().then((result: JobResult) => {
            expect(result.id).to.equal(id1);
            expect(result.name).to.equal("test-job-name");
            expect(result.data).to.equal("Job Return Value");

            expect(sch.getStatus(id1)).to.equal(JobStatus.Completed);
        });
    });

    it("should be schedule and run a job with custom listener", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");

        let listener: JobListener = {
            onJobStarted: (result: JobResult) =>
                console.log("Started in Custom Listener"),
            onJobRunning: (result: JobResult) =>
                console.log("Running in Custom Listener"),
            onJobCompleted: (result: JobResult) =>
                console.log("Complete in Custom Listener")
        };
        let spy = sinon.spy(listener, "onJobStarted");
        let spy2 = sinon.spy(listener, "onJobCompleted");
        let spy3 = sinon.spy(listener, "onJobRunning");

        //force run
        let id1 = sch.schedule(job, listener);
        return sch.consume().then((result: JobResult) => {
            expect(result.id).to.equal(id1);
            expect(result.name).to.equal("test-job-name");
            expect(result.data).to.equal("Job Return Value");
            expect(sch.getStatus(id1)).to.equal(JobStatus.Completed);

            sinon.assert.calledOnce(spy);
            sinon.assert.calledOnce(spy2);
            sinon.assert.calledOnce(spy3);
        });
    });

    it("should be schedule and run a job with some listener", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");

        let listener: JobListener = {
            onJobCompleted: (result: JobResult) =>
                console.log("Complete in Custom Listener")
        };
        let spy = sinon.spy(listener, "onJobCompleted");

        //force run
        let id1 = sch.schedule(job, listener);
        return sch.consume().then((result: JobResult) => {
            sinon.assert.calledOnce(spy);
        });
    });

    it("can attach a listener to and a job", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");

        let listener: JobListener = {
            onJobCompleted: (result: JobResult) =>
                console.log("Complete in Custom Listener")
        };
        let spy = sinon.spy(listener, "onJobCompleted");

        //force run
        let id1 = sch.schedule(job);
        sch.attachListener(id1, listener);
        return sch.consume().then((result: JobResult) => {
            sinon.assert.calledOnce(spy);
        });
    });

    it("cannot attach a listener to a completed job", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");

        let listener: JobListener = {
            onJobCompleted: (result: JobResult) =>
                console.log("Complete in Custom Listener")
        };
        //force run
        let id1 = sch.schedule(job);
        sch.attachListener(id1, listener);
        return sch.consume().then((result: JobResult) => {
            let attached = sch.attachListener(id1, listener);
            expect(attached).to.equal("Unable to Attach To Completed Job");
        });
    });

    it("cannot attach a listener to a bound job", () => {
        const sch = new Dispatcher({ manualMode: true });
        const job = new TestScheduledJob("test-job-name");

        let listener: JobListener = {
            onJobCompleted: (result: JobResult) =>
                console.log("Complete in Custom Listener")
        };

        let listener2: JobListener = {
            onJobCompleted: (result: JobResult) =>
                console.log("Complete in Custom Listener")
        };
        //force run
        let id1 = sch.schedule(job, listener);
        let bound = sch.attachListener(id1, listener2);
        expect(bound).to.equal("Listener Already Bound");
    });
});
