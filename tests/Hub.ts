import {DispatchStrategyType, Orchestrator} from "../src";

const orch = new Orchestrator({
    startServer: true,
    strategy: DispatchStrategyType.ROUND_ROBIN
});
