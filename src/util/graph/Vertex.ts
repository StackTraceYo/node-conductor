import {Edge} from "./Edge";


export class Vertex<T> {

    private _label: string;
    private _data: T;
    private _edges: { [key: string]: Edge; };
    private _edgeCount = 0;

    constructor(name: string, data?: T) {
        this._edges = {};
        this._label = name;
        this._data = data;
    }


    findVertex(label: string): Vertex<T> {
        let edge = this._edges[label];
        return edge ? edge.v2 : null
    }


    addVertex(vertex: Vertex<T>): Vertex<T> {
        if (this.findVertex(vertex._label)) {
            console.log(`Vertex with label ${vertex._label} exists- -> cannot add`);
            return this;
        }
        this._edges[vertex._label] = new Edge(this, vertex);
        this._edgeCount++;
        return this;
    }

    setData(value: T): Vertex<T> {
        this._data = value;
        return this;
    }

    get edgeCount() {
        return this._edgeCount;
    }

    get edges() {
        return this._edges;
    }


    get label(): string {
        return this._label;
    }

    get data(): T {
        return this._data;
    }
}