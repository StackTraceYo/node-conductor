import {ConductorClient} from "../src";

(async () => {
    const c = await new ConductorClient({
        address: "http://localhost:8999"
    }).start();
    const x = await c.pending();
    console.log(x)
})();




