import * as express from 'express';
import * as http from 'http';
import * as bodyparser from 'body-parser';
import {Orchestrator} from "./orchestration/orchestrator/Orchestrator";
import {RemoteWorker} from "./orchestration/worker/RemoteWorker";
import * as uuid from "uuid";
import {DispatchStrategyType} from "./orchestration/strategy/DispatchStrategy";

const app = express();
const bodyParser = bodyparser;
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const router = express.Router();
const server = http.createServer(app);

const orch = new Orchestrator({strategy: DispatchStrategyType.ROUND_ROBIN});

app.use('/worker', router);
router.post('/schedule', function (req, res) {
    const jobs: string[] = req.body.jobs;
    if (jobs) {
        let address = req.ip;
        if (req.body.address) {
            address = req.body.address;
        }
        address = req.body.port ? address + ":" + req.body.port : address;
        const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), address, jobs);
        // orch.register(remoteWorker.id, remoteWorker);
        console.log(remoteWorker);

        res.json({message: 'success', id: remoteWorker.id});
    }

});


server.listen(process.env.PORT || 8888, () => {
    console.log(`Hub started on port ${server.address().port}`);
});

