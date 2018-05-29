import { Orchestrator } from "../src/orchestration/orchestrator/Orchestrator";
import { DispatchStrategyType } from "../src/orchestration/strategy/DispatchStrategy";

const orch = new Orchestrator({
    strategy: DispatchStrategyType.ROUND_ROBIN,
    startServer: true
});
