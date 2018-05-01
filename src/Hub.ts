import {Orchestrator} from "./orchestration/orchestrator/Orchestrator";
import {DispatchStrategyType} from "./orchestration/strategy/DispatchStrategy";

const orch = new Orchestrator({strategy: DispatchStrategyType.ROUND_ROBIN});
