import "mocha";
import { expect } from "chai";

import { RemoteWorker } from "../../../src/orchestration/worker/RemoteWorker";
import * as uuid from "uuid";
import {
    DispatchStrategyType,
    RoundRobinDispatchStrategy
} from "../../../src/orchestration/strategy/DispatchStrategy";

describe("Round Robin Dispatch Strategy", () => {
    it("should be created with defaults", () => {
        const strat = new RoundRobinDispatchStrategy();
        expect(strat.type).to.equal(DispatchStrategyType.ROUND_ROBIN);
        expect(strat.workers).to.be.empty;
        expect(strat.pick()).to.be.undefined;
    });

    it("should accept workers", () => {
        const strat = new RoundRobinDispatchStrategy();

        const remoteWorker: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost",
            ["test"]
        );
        const remoteWorker2: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost2",
            ["test"]
        );
        const remoteWorker3: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost3",
            ["test"]
        );

        strat.workers = [remoteWorker, remoteWorker2, remoteWorker3];
        expect(strat.workers.length).to.be.equal(3);
    });

    it("should pick workers in round robin fashion", () => {
        const strat = new RoundRobinDispatchStrategy();

        const remoteWorker: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost",
            ["test"]
        );
        const remoteWorker2: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost2",
            ["test"]
        );
        const remoteWorker3: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost3",
            ["test"]
        );

        strat.workers = [remoteWorker, remoteWorker2, remoteWorker3];
        expect(strat.workers.length).to.be.equal(3);

        let picked = strat.pick();
        expect(picked).to.equal(remoteWorker);
        picked = strat.pick();
        expect(picked).to.equal(remoteWorker2);
        picked = strat.pick();
        expect(picked).to.equal(remoteWorker3);
        picked = strat.pick();
        expect(picked).to.equal(remoteWorker);
    });

    it("should restart worker count when workers are reset", () => {
        const strat = new RoundRobinDispatchStrategy();

        const remoteWorker: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost",
            ["test"]
        );
        const remoteWorker2: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost2",
            ["test"]
        );
        const remoteWorker3: RemoteWorker = new RemoteWorker(
            uuid.v4(),
            "localhost3",
            ["test"]
        );

        strat.workers = [remoteWorker, remoteWorker2];
        // expect(strat.workers.length).to.be.equal(3);

        let picked = strat.pick();
        expect(picked).to.equal(remoteWorker);
        strat.workers = [remoteWorker, remoteWorker2, remoteWorker3];
        picked = strat.pick();
        expect(picked).to.equal(remoteWorker);
        picked = strat.pick();
        expect(picked).to.equal(remoteWorker2);
        picked = strat.pick();
        expect(picked).to.equal(remoteWorker3);
    });
});
