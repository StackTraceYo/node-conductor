"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const bodyparser = require("body-parser");
class WorkNodeServer {
    constructor(workerNode, config) {
        this.workerNode = workerNode;
        this.app = express();
        this.bodyParser = bodyparser;
        this.router = express.Router();
        this.server = http.createServer(this.app);
        this.app.use(this.bodyParser.urlencoded({ extended: true }));
        this.app.use(this.bodyParser.json());
        this.app.use("/worker", this.router);
        this.router.post("/schedule", (req, res) => {
            const jobName = req.body.name;
            const jobParams = req.body.params;
            if (jobName) {
                let id = this.workerNode.schedule(jobName, jobParams);
                console.log({ message: id });
                res.json({ message: id });
            }
            else {
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
exports.WorkNodeServer = WorkNodeServer;
