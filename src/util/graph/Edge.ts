import {Vertex} from "./Vertex";

export class Edge {

    //v1 -> v2
    private _v1: Vertex;
    private _v2: Vertex;

    constructor(v1: Vertex, v2: Vertex) {
        this._v1 = v1;
        this._v2 = v2;
    }

    adjacent(current: Vertex) {
        if (current.label === this._v1.label) {
            return this._v2;
        } else if (current.label === this._v2.label) {
            return this._v1;
        }
        return null;
    }


    get v1(): Vertex {
        return this._v1;
    }

    get v2(): Vertex {
        return this._v2;
    }
}