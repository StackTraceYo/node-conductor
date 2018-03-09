import {Vertex} from "../../util/graph/Vertex";
import * as _ from "lodash";

export interface FlowDefinition {
    job: any
    name: string
    dependents?: FlowDefinition[]
}

export interface FlowData {
    job: string,
    name: string,
    running: boolean,
    completed: boolean
}

export class FlowGraph extends Vertex<FlowData> {

    private _flowDef: FlowDefinition;
    private _built: boolean;
    private _current: Vertex<FlowData>;
    private _step: Vertex<FlowData>[];

    constructor(name: string) {
        super(name);
        this._built = false;
        this._step = [];
    }

    withFlowDef(def: FlowDefinition) {
        this._flowDef = def;
        return this;
    }

    build() {
        this.setData({
            name: this._flowDef.name,
            job: this._flowDef.job,
            running: false,
            completed: false
        });

        _.forEach(this._flowDef.dependents, ((def) => {
            this._step.push(this.apply(this, def));
        }));

        this._built = true;
        this._current = this;
        return this;
    }

    apply(vparent: Vertex<FlowData>, flowDef: FlowDefinition) {
        let flowDefVertex = new Vertex(flowDef.name, {
            name: flowDef.name,
            job: flowDef.job,
            running: false,
            completed: false
        });
        vparent.addVertex(flowDefVertex);
        _.forEach(flowDef.dependents, ((def) => {
            this.apply(flowDefVertex, def);
        }));
        return flowDefVertex;
    }

    get currentStepName() {
        return this._current.label
    }

    get currentStep() {
        return this._current;
    }

    get currentDependents() {
        return this._current.edges
    }

    get step() {
        return this._step
    }

    traverse() {
        //we have dependents
        if (this._step.length > 0) {

        }
    }

}