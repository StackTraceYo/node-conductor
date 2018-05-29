import { WorkNode } from "./WorkNode";
import * as express from "express";
import * as http from "http";
import * as bodyparser from "body-parser";

export class WorkNodeServer {
    private app = express();
    private bodyParser = bodyparser;
    private router = express.Router();
    private server = http.createServer(this.app);

    constructor(private workerNode: WorkNode, config: any) {
        this.app.use(this.bodyParser.urlencoded({ extended: true }));
        this.app.use(this.bodyParser.json());
        this.app.use("/worker", this.router);

        this.router.post("/schedule", (req, res) => {
            const jobName: string = req.body.name;
            const jobParams: string = req.body.params;
            if (jobName) {
                let id = this.workerNode.schedule(jobName, jobParams);
                console.log({ message: id });
                res.json({ message: id });
            } else {
                res.json({ message: "no job found" });
            }
        });

        this.router.post("/disconnect", (req, res) => {
            res.json({ message: this.workerNode.id });
            console.log("Disconnecting From: ", req.body.id);
            this.workerNode.disconnect();
        });

        this.server.listen(process.env.PORT || config.port || 8888, () => {
            console.log(`Worker started on port ${this.server.address().port}`);
        });
    }
}
