import 'mocha';
import {FlowDefinition, FlowGraph} from "./FlowGraph";
import {expect} from 'chai';

let testFlowDef: FlowDefinition = {
    job: "job-placeholder",
    name: "start",
    dependents: [
        {
            job: "job-1a-placeholder",
            name: "level1a"
        },
        {
            job: "job-1b-placeholder",
            name: "level1b",
            dependents: [
                {
                    job: "job-2b-placeholder",
                    name: "level2b",
                }
            ]
        },
        {
            job: "job-1c-placeholder",
            name: "level1c"
        }
    ]
};

describe('Flow Graph', () => {

    it('should be created', () => {
        const graph = new FlowGraph("flow-graph")
            .withFlowDef(testFlowDef)
            .build();

        expect(graph).to.not.equal(null)
    });

    it('should have correct inital steps', () => {
        const graph = new FlowGraph("flow-graph")
            .withFlowDef(testFlowDef)
            .build();

        expect(graph.currentStep).to.equal(graph);
        expect(graph.currentStepName).to.equal('flow-graph');
        expect(graph.currentStep.edgeCount).to.equal(3);

        expect(graph.edgeCount).to.equal(3);
        expect(graph.edges['level1a'].v2.data.job).to.equal(testFlowDef.dependents[0].job);
        expect(graph.edges['level1a'].v2.data.name).to.equal(testFlowDef.dependents[0].name);
        expect(graph.edges['level1a'].v2.data.completed).to.equal(false);
        expect(graph.edges['level1a'].v2.data.running).to.equal(false);

        expect(graph.edges['level1b'].v2.data.job).to.equal(testFlowDef.dependents[1].job);
        expect(graph.edges['level1b'].v2.data.name).to.equal(testFlowDef.dependents[1].name);
        expect(graph.edges['level1b'].v2.data.completed).to.equal(false);
        expect(graph.edges['level1b'].v2.data.running).to.equal(false);

        expect(graph.edges['level1c'].v2.data.job).to.equal(testFlowDef.dependents[2].job);
        expect(graph.edges['level1c'].v2.data.name).to.equal(testFlowDef.dependents[2].name);
        expect(graph.edges['level1c'].v2.data.completed).to.equal(false);
        expect(graph.edges['level1c'].v2.data.running).to.equal(false);

        console.log(graph.step)
        // console.log(graph);
        // console.log(graph.edges['level1a']);
        // console.log(graph.edges['level1b']);
        // console.log(graph.edges['level1b'].v2.edges["level2b"]);
        // console.log(graph.edges['level1c']);
    });

});