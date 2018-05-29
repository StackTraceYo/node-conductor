import {expect} from 'chai';
import 'mocha';
import {Orchestrator} from "./Orchestrator";
import {DispatchStrategyType} from "../strategy/DispatchStrategy";
import {RemoteWorker} from "../worker/RemoteWorker";
import * as uuid from "uuid";
import * as _ from "lodash";

describe('Orchestrator', () => {

    let orch: Orchestrator;

    beforeEach(() => {
        orch = new Orchestrator({
            strategy: DispatchStrategyType.ROUND_ROBIN,
            startServer: false
        });
    });

    it('should be created', () => {
        expect(orch).to.not.equal(null);
        expect(orch.strategy.type).to.equal(DispatchStrategyType.ROUND_ROBIN)
    });

    it('should register and unregister remote worker', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.register('localhost', remoteWorker);
        orch.register('localhost2', remoteWorker2);
        orch.register('localhost3', remoteWorker3);

        expect(orch.workerslist.length).to.equal(3);
        expect(orch.workerslist).contains(remoteWorker);
        expect(orch.workerslist).contains(remoteWorker2);
        expect(orch.workerslist).contains(remoteWorker3);

        expect(orch.workers[remoteWorker.address]).to.equal(remoteWorker);
        expect(orch.workers[remoteWorker2.address]).to.equal(remoteWorker2);
        expect(orch.workers[remoteWorker3.address]).to.equal(remoteWorker3);

        expect(orch.idworkers[remoteWorker.id]).to.equal(remoteWorker);
        expect(orch.idworkers[remoteWorker2.id]).to.equal(remoteWorker2);
        expect(orch.idworkers[remoteWorker3.id]).to.equal(remoteWorker3);

        expect(orch.strategy.workers).contains(remoteWorker);
        expect(orch.strategy.workers).contains(remoteWorker2);
        expect(orch.strategy.workers).contains(remoteWorker3);

    });

    it('should register and unregister remote worker', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.register('localhost', remoteWorker);
        orch.register('localhost2', remoteWorker2);
        orch.register('localhost3', remoteWorker3);

        expect(orch.workerslist.length).to.equal(3);
        expect(orch.workerslist).contains(remoteWorker);
        expect(orch.workerslist).contains(remoteWorker2);
        expect(orch.workerslist).contains(remoteWorker3);

        expect(orch.workers[remoteWorker.address]).to.equal(remoteWorker);
        expect(orch.workers[remoteWorker2.address]).to.equal(remoteWorker2);
        expect(orch.workers[remoteWorker3.address]).to.equal(remoteWorker3);

        expect(orch.idworkers[remoteWorker.id]).to.equal(remoteWorker);
        expect(orch.idworkers[remoteWorker2.id]).to.equal(remoteWorker2);
        expect(orch.idworkers[remoteWorker3.id]).to.equal(remoteWorker3);

        expect(orch.strategy.workers).contains(remoteWorker);
        expect(orch.strategy.workers).contains(remoteWorker2);
        expect(orch.strategy.workers).contains(remoteWorker3);


        //unregister

        orch.unregister('localhost', remoteWorker.id);
        orch.unregister('localhost2', remoteWorker2.id);
        orch.unregister('localhost3', remoteWorker3.id);

        expect(orch.workerslist).to.be.empty;
        expect(orch.workers).to.be.empty;
        expect(orch.idworkers).to.be.empty;

        expect(orch.strategy.workers).to.be.empty;

    });

    it('should return pending jobs', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.pend('job-id-0', remoteWorker);
        orch.pend('job-id-1', remoteWorker);
        orch.pend('job-id-2', remoteWorker2);
        orch.pend('job-id-3', remoteWorker2);
        orch.pend('job-id-4', remoteWorker3);
        orch.pend('job-id-5', remoteWorker3);

        expect(orch.pending.jobs.length).to.equal(6);
        expect(orch.all.jobs.length).to.equal(6);

        _.forEach(orch.pending.jobs, value => {
            expect(value.status).to.equal('pending');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });

        _.forEach(orch.all.jobs, value => {
            expect(value.status).to.equal('pending');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });

    });

    it('should complete jobs that are pending', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.pend('job-id-0', remoteWorker);
        orch.pend('job-id-1', remoteWorker);
        orch.pend('job-id-2', remoteWorker2);
        orch.pend('job-id-3', remoteWorker2);
        orch.pend('job-id-4', remoteWorker3);
        orch.pend('job-id-5', remoteWorker3);

        expect(orch.pending.jobs.length).to.equal(6);
        expect(orch.all.jobs.length).to.equal(6);

        orch.complete(remoteWorker.id, 'job-id-0', 'data');
        expect(orch.pending.jobs.length).to.equal(5);


        // should not complete jobs from different worker
        orch.complete(remoteWorker2.id, 'job-id-1', 'data');
        orch.complete(remoteWorker3.id, 'job-id-2', 'data');
        expect(orch.pending.jobs.length).to.equal(5);

        orch.complete(remoteWorker.id, 'job-id-1', 'data');
        expect(orch.pending.jobs.length).to.equal(4);
        orch.complete(remoteWorker2.id, 'job-id-2', 'data');
        expect(orch.pending.jobs.length).to.equal(3);
        orch.complete(remoteWorker2.id, 'job-id-3', 'data');
        expect(orch.pending.jobs.length).to.equal(2);
        orch.complete(remoteWorker3.id, 'job-id-4', 'data');
        expect(orch.pending.jobs.length).to.equal(1);
        orch.complete(remoteWorker3.id, 'job-id-5', 'data');
        expect(orch.pending.jobs.length).to.equal(0);

    });

    it('should complete jobs', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.pend('job-id-0', remoteWorker);
        orch.pend('job-id-1', remoteWorker);
        orch.pend('job-id-2', remoteWorker2);
        orch.pend('job-id-3', remoteWorker2);
        orch.pend('job-id-4', remoteWorker3);
        orch.pend('job-id-5', remoteWorker3);

        expect(orch.pending.jobs.length).to.equal(6);
        expect(orch.all.jobs.length).to.equal(6);

        orch.complete(remoteWorker.id, 'job-id-0', 'data0');
        orch.complete(remoteWorker.id, 'job-id-1', 'data1');
        orch.complete(remoteWorker2.id, 'job-id-2', 'data2');
        orch.complete(remoteWorker2.id, 'job-id-3', 'data3');
        orch.complete(remoteWorker3.id, 'job-id-4', 'data4');
        orch.complete(remoteWorker3.id, 'job-id-5', 'data5');

        expect(orch.pending.jobs.length).to.equal(0);
        expect(orch.all.jobs.length).to.equal(6);
        expect(orch.completed.jobs.length).to.equal(6);

        _.forEach(orch.completed.jobs, value => {
            expect(value.status).to.equal('done');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });

        _.forEach(orch.all.jobs, value => {
            expect(value.status).to.equal('done');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });
    });

    it('should return job results', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.pend('job-id-0', remoteWorker);
        orch.pend('job-id-1', remoteWorker);
        orch.pend('job-id-2', remoteWorker2);
        orch.pend('job-id-3', remoteWorker2);
        orch.pend('job-id-4', remoteWorker3);
        orch.pend('job-id-5', remoteWorker3);

        orch.complete(remoteWorker.id, 'job-id-0', 'data0');
        orch.complete(remoteWorker.id, 'job-id-1', 'data1');
        orch.complete(remoteWorker2.id, 'job-id-2', 'data2');
        orch.complete(remoteWorker2.id, 'job-id-3', 'data3');
        orch.complete(remoteWorker3.id, 'job-id-4', 'data4');
        orch.complete(remoteWorker3.id, 'job-id-5', 'data5');

        //fetch can get job results and not remove
        expect(orch.fetch('job-id-0').data).to.be.equal('data0');
        expect(orch.fetch('job-id-0').data).to.be.equal('data0');

        expect(orch.fetch('job-id-1').data).to.be.equal('data1');
        expect(orch.fetch('job-id-2').data).to.be.equal('data2');
        expect(orch.fetch('job-id-3').data).to.be.equal('data3');
        expect(orch.fetch('job-id-4').data).to.be.equal('data4');

        //get should retrieve job data and delete it
        expect(orch.get('job-id-5').data).to.be.equal('data5');
        expect(orch.fetch('job-id-5')).to.be.undefined;
    });

    it('should error jobs', () => {
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost', ['test']);
        const remoteWorker2: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost2', ['test']);
        const remoteWorker3: RemoteWorker = new RemoteWorker(uuid.v4(), 'localhost3', ['test']);
        orch.pend('job-id-0', remoteWorker);
        orch.pend('job-id-1', remoteWorker);
        orch.pend('job-id-2', remoteWorker2);
        orch.pend('job-id-3', remoteWorker2);
        orch.pend('job-id-4', remoteWorker3);
        orch.pend('job-id-5', remoteWorker3);

        expect(orch.pending.jobs.length).to.equal(6);
        expect(orch.all.jobs.length).to.equal(6);

        orch.error(remoteWorker.id, 'job-id-0', 'exception-0');
        orch.error(remoteWorker.id, 'job-id-1', 'exception-1');
        orch.error(remoteWorker2.id, 'job-id-2', 'exception-2');
        orch.error(remoteWorker2.id, 'job-id-3', 'exception-3');
        orch.error(remoteWorker3.id, 'job-id-4', 'exception-4');
        orch.error(remoteWorker3.id, 'job-id-5', 'exception-5');

        expect(orch.pending.jobs.length).to.equal(0);
        expect(orch.all.jobs.length).to.equal(6);
        expect(orch.completed.jobs.length).to.equal(6);
        expect(orch.errored.jobs.length).to.equal(6);

        _.forEach(orch.completed.jobs, value => {
            expect(value.status).to.equal('error');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });

        _.forEach(orch.errored.jobs, value => {
            expect(value.status).to.equal('error');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });

        _.forEach(orch.all.jobs, value => {
            expect(value.status).to.equal('error');

            let status = orch.status(value.id);
            expect(status.worker).to.equal(value.worker);
            expect(status.status).to.equal(value.status);
        });

        expect(orch.fetch('job-id-0').data).to.be.equal('exception-0');
        expect(orch.fetch('job-id-1').data).to.be.equal('exception-1');
        expect(orch.fetch('job-id-2').data).to.be.equal('exception-2');

    });


});