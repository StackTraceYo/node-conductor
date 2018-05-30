"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyparser = require("body-parser");
const express = require("express");
const http = require("http");
const uuid = require("uuid");
const RemoteWorker_1 = require("../worker/RemoteWorker");
class OrchestratorServer {
    constructor(_orch) {
        this._orch = _orch;
        this.app = express();
        this.bodyParser = bodyparser;
        this.router = express.Router();
        this.server = http.createServer(this.app);
        this.app.use(this.bodyParser.urlencoded({ extended: true }));
        this.app.use(this.bodyParser.json());
        this.app.use("/orchestrator", this.router);
        this.router.post("/register", (req, res) => {
            const jobs = req.body.jobs;
            if (jobs) {
                let address = req.ip;
                if (req.body.address) {
                    address = req.body.address;
                }
                address = req.body.port
                    ? address + ":" + req.body.port
                    : address;
                const remoteWorker = new RemoteWorker_1.RemoteWorker(uuid.v4(), address, jobs);
                this._orch.register(remoteWorker.id, remoteWorker);
                res.json({ message: "success", id: remoteWorker.id });
            }
        });
        this.router.post("/disconnect", (req, res) => {
            let address = req.ip;
            if (req.body.address) {
                address = req.body.address;
            }
            address = req.body.port ? address + ":" + req.body.port : address;
            this._orch.unregister(address, req.body.id);
            res.json({ message: "success" });
        });
        this.router.post("/job/complete", (req, res) => {
            console.log("Completed Job:", req.body);
            const jobId = req.body.jobId || false;
            const worker = req.body.worker || false;
            const result = req.body.result;
            const isError = req.body.error;
            if (jobId && worker) {
                if (isError) {
                    this._orch.error(worker, jobId, result);
                }
                else {
                    this._orch.complete(worker, jobId, result);
                }
                res.json({ message: "success", id: jobId });
            }
            else {
                res.json({
                    message: "missing one or more values",
                    id: jobId,
                    worker
                });
            }
        });
        this.router.get("/test", (req, res) => {
            const result = this._orch.schedule("test");
            res.json(result);
        });
        this.router.get("/job/", (req, res) => {
            return res.json(this._orch.all);
        });
        this.router.get("/job/done", (req, res) => {
            return res.json(this._orch.completed);
        });
        this.router.get("/job/pending", (req, res) => {
            return res.json(this._orch.pending);
        });
        this.router.get("/job/:job_id", (req, res) => {
            return res.json(this._orch.status(req.params.job_id));
        });
        this.router.get("/job/:job_id/result", (req, res) => {
            const data = this._orch.get(req.params.job_id);
            data
                ? res.json({ message: "ok", data })
                : res.json({ message: "none", data });
        });
        this.router.get("/job/:job_id/check", (req, res) => {
            const data = this._orch.fetch(req.params.job_id);
            data
                ? res.json({ message: "ok", data })
                : res.json({ message: "none", data });
        });
        this.server.listen(process.env.PORT || 8999, () => {
            console.log(`Orchestrator started on port ${this.server.address().port}`);
        });
    }
}
exports.OrchestratorServer = OrchestratorServer;
