import {Dispatcher} from "../../dispatch/dispatcher/Dispatcher";
import {FlowData, FlowDefinition, FlowGraph} from "../flow/FlowGraph";
import uuid = require("uuid");

export class Orchestrator {

    private _dispatcher: Dispatcher;
    private _flow: FlowGraph;


    constructor(dispatcher: Dispatcher) {
        this._dispatcher = dispatcher;
    }

    orchestrate(graph?: FlowGraph, def?: FlowDefinition) {
        if (def) {
            let id = uuid();
            this._flow = new FlowGraph(id);
        } else if (graph) {
            this._flow = graph;
        }
    }

    cycle() {
        //current traversal flow information
        let step = this._flow.step;
        let data: FlowData = this._flow.currentStep.data;

        let jobName = data.job;
        let name = data.name;
        let running = data.running;
        let completed = data.completed;
        //if the current pointer is not running start it
        if (!running) {
            //make listeners
            //schedule
        }
        if (completed) {
            //move pointer
            //schedule
        }
    }


}