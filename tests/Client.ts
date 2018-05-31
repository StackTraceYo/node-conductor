import {ConductorClient} from "../src";

const x = async () => {
    const c = await new ConductorClient({
        address: "http://localhost:8999"
    }).start();
};




