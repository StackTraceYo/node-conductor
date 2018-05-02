import {Orchestrator} from "./Orchestrator";
import * as http from "http";
import * as express from 'express';
import * as bodyparser from 'body-parser';
import * as uuid from "uuid";
import {RemoteWorker} from "../worker/RemoteWorker";

export class OrchestratorServer {

    private app = express();
    private bodyParser = bodyparser;
    private router = express.Router();
    private server = http.createServer(this.app);

    constructor(private orch: Orchestrator) {
        this.app.use(this.bodyParser.urlencoded({extended: true}));
        this.app.use(this.bodyParser.json());


        this.app.use('/hub', this.router);

        this.router.post('/register', (req, res) => {
            const jobs: string[] = req.body.jobs;
            if (jobs) {
                let address = req.ip;
                if (req.body.address) {
                    address = req.body.address;
                }
                address = req.body.port ? address + ":" + req.body.port : address;
                const remoteWorker: RemoteWorker = new RemoteWorker(uuid.v4(), address, jobs);
                this.orch.register(remoteWorker.id, remoteWorker);
                res.json({message: 'success', id: remoteWorker.id});
            }
        });

        this.router.post('/job/complete', (req, res) => {
            console.log('Completed Job:', req.body);
            const jobId = req.body.job || false;
            const worker = req.body.worker || false;
            const result: any = req.body.jobResult;
            if (jobId && worker) {
                this.orch.complete(worker, jobId, result);
                res.json({message: 'success', id: jobId})
            } else {
                res.json({message: 'missing one or more values', id: jobId, worker: worker})
            }
        });

        this.router.get('/test', (req, res) => {
            this.orch.schedule('test');
            res.json({message: 'ok'})
        });

        this.server.listen(process.env.PORT || 8999, () => {
            console.log(`Orchestrator started on port ${this.server.address().port}`);
        });
    }
}