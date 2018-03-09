import 'mocha';
import {expect} from 'chai';
import {Vertex} from "./Vertex";


describe('Vertex', () => {

    it('should be created and add edges', () => {
        const result = new Vertex('v1');

        result.addVertex(new Vertex('v2'));
        result.addVertex(new Vertex('v3'));
        result.addVertex(new Vertex('v4'));

        expect(result.edgeCount).to.equal(3);

    });

    it('should not add edge to a vertex with a matching name', () => {
        const result = new Vertex('v1');

        result.addVertex(new Vertex('v2'));
        result.addVertex(new Vertex('v2'));
        result.addVertex(new Vertex('v2'));
        result.addVertex(new Vertex('v2'));

        expect(result.edgeCount).to.equal(1);

    });

    it('should be find vertices', () => {
        const result = new Vertex('v1');

        result.addVertex(new Vertex('v2', 'test2'));
        result.addVertex(new Vertex('v3', 'test3'));
        result.addVertex(new Vertex('v4', 'test4'));


        expect(result.edgeCount).to.equal(3);
        expect(result.findVertex('v2').data).to.equal('test2');
        expect(result.findVertex('v3').data).to.equal('test3');
        expect(result.findVertex('v4').data).to.equal('test4');

        expect(result.findVertex('v5')).equal(null);

    });

    it('should be find adjacent vertices', () => {
        const v1 = new Vertex('v1');
        const v2 = new Vertex('v2');
        const v3 = new Vertex('v3');
        const v4 = new Vertex('v4');

        v1.addVertex(v2);
        v1.addVertex(v3);
        v1.addVertex(v4);


        expect(v1.edgeCount).to.equal(3);
        expect(v1.edges['v2'].adjacent(v1)).to.equal(v2);
        expect(v1.edges['v3'].adjacent(v1)).to.equal(v3);
        expect(v1.edges['v4'].adjacent(v1)).to.equal(v4);

        expect(v1.edges['v2'].adjacent(v2)).to.equal(v1);
        expect(v1.edges['v3'].adjacent(v3)).to.equal(v1);
        expect(v1.edges['v4'].adjacent(v4)).to.equal(v1);

    });


});