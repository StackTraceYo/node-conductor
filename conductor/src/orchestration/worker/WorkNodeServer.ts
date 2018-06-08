import * as bodyparser from "body-parser";
import * as express from "express";
import * as http from "http";
import * as winston from "winston";
import {WorkNode} from "./WorkNode";


export class WorkNodeServer {
    private app = express();
    private bodyParser = bodyparser;
    private router = express.Router();
    private server = http.createServer(this.app);
    private LOGGER = winston.loggers.get("WORKNODE-SERVER");

    constructor(private workerNode: WorkNode, config: any) {
        this.app.use(this.bodyParser.urlencoded({extended: true}));
        this.app.use(this.bodyParser.json());
        this.app.use("/worker", this.router);

        this.router.post("/schedule", (req, res) => {
            const jobName: string = req.body.name;
            const jobParams: string = req.body.params;
            if (jobName) {
                const id = this.workerNode.schedule(jobName, jobParams);
                this.LOGGER.info("Scheduled..", {message: id});
                res.json({message: id});
            } else {
                res.json({message: "no job found"});
            }
        });

        this.router.post("/disconnect", (req, res) => {
            res.json({message: this.workerNode.id});
            this.LOGGER.info("Disconnecting From: ", req.body.id);
            this.workerNode.disconnect();
        });

        this.server.listen(process.env.PORT || config.port || 8888, () => {
            this.LOGGER.info(`Worker started at ${this.server.address}`);
        });
    }
}
