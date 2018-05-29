import { expect } from "chai";
import "mocha";
import { Queue } from "../../../src/util/queue/Queue";

describe("Queue", () => {
    it("should be created", () => {
        const result = new Queue<String>();
        expect(result).to.not.equal(null);
        expect(result.isEmpty()).to.equal(true);
    });

    it("should enqueue", () => {
        const q = new Queue<String>();
        q.enqueue("Test");
        q.enqueue("Test 2");
        q.enqueue("Test 3");
        q.enqueue("Test 4");

        const empty = q.isEmpty();
        const size = q.length();
        expect(empty).to.equal(false);
        expect(size).to.equal(4);
    });

    it("should return undefined for empty queue", () => {
        const q = new Queue<String>();
        q.dequeue();
        const result = q.dequeue();
        expect(result).to.equal(undefined);
        expect(q.length()).to.equal(0);
    });

    it("should dequeue in correct order", () => {
        const q = new Queue<String>();
        q.enqueue("Test");
        q.enqueue("Test 2");
        q.enqueue("Test 3");
        q.enqueue("Test 4");

        q.dequeue(); //Test
        q.dequeue(); //Test 2
        const result = q.dequeue();
        expect(result).to.equal("Test 3");

        q.enqueue("Test 5");
        expect(q.dequeue()).to.equal("Test 4");
        expect(q.length()).to.equal(1);
    });

    it("should allow peeking", () => {
        const q = new Queue<String>();
        q.enqueue("Test");
        q.enqueue("Test 2");
        q.enqueue("Test 3");
        q.enqueue("Test 4");

        let result = q.peek();
        expect(result).to.equal("Test");
        result = q.peek();
        expect(result).to.equal("Test");
    });
});
