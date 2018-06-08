import {ConductorClient} from "../src";

(async () => {
    const c = await new ConductorClient({
        address: "http://localhost:8999"
    }).start();
    // console.log(await c.check('asd'))
    // console.log(await c.jobs())
    // console.log(await c.health())
    // console.log(await c.done())
    // console.log(await c.pending())
    // console.log(await c.result('asd'))
    // console.log(await c.status('asd'))
})();
