import {expect} from 'chai';
import 'mocha';
import {END, EXEC, Job, JobResult, START} from "./Job";
import * as sinon from 'sinon'

class TestJob extends Job<String> {

    async execute(): Promise<string> {
        this.emit("Executing Job");
        return "Job Return Value";
    }
}

describe('Job', () => {

    it('should be created', () => {
        const result = new TestJob('test-job-name');
        expect(result).to.not.equal(null);
    });

    it('should emit Start Event', () => {
        const job = new TestJob('test-job-name');

        let spy = sinon.spy();
        job.on(START, spy);

        job.start('test');
        sinon.assert.calledOnce(spy);
    });

    it('should emit Executing Event', () => {
        const job = new TestJob('test-job-name');

        let spy = sinon.spy();
        job.on(EXEC, spy);

        job.start('test');
        sinon.assert.calledOnce(spy);
    });

    it('should emit Ending Event', () => {
        const job = new TestJob('test-job-name');

        let spy = sinon.spy();
        job.on(END, spy);

        return job.start('test')
            .then((result : JobResult) => {
                expect(result.data).to.equal("Job Return Value");
                sinon.assert.calledOnce(spy);
            })
    });

    it('should emit Running Event', () => {
        const job = new TestJob('test-job-name');

        let spy = sinon.spy();

        job.on("Executing Job", spy);

        job.start('test');
        sinon.assert.calledOnce(spy);
    });

    it('should emit all Events', () => {
        const job = new TestJob('test-job-name');

        let startSpy = sinon.spy();
        let execSpy = sinon.spy();
        let runSpy = sinon.spy();
        let endSpy = sinon.spy();

        job.on(START, startSpy);
        job.on(EXEC, execSpy);
        job.on("Executing Job", runSpy);
        job.on(END, endSpy);

        return job.start('test')
            .then(value => {
                sinon.assert.calledOnce(startSpy);
                sinon.assert.calledOnce(execSpy);
                sinon.assert.calledOnce(runSpy);
                sinon.assert.calledOnce(endSpy);
                //assert order
                sinon.assert.callOrder(startSpy, execSpy, runSpy, endSpy);
            })
    });

    it('should store and retrieve data value', () => {
        const job = new TestJob('test-job-name');

        return job.start('test')
            .then(resolved => {
                expect(job.getResult()).equals("Job Return Value");
            });
    });

    xit('can be serialized', () => {
        const job = new TestJob('test-job-name');

        let s = JSON.stringify(job.start);
        let f : Function = JSON.parse(s);
        return f('test')
            .then(resolved => {
                expect(job.getResult()).equals("Job Return Value");
            });
    });

});