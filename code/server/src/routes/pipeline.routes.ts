import * as express from "express";
import { pipelineService } from "../services/pipeline.service";

export const pipelineRouter = express.Router();

pipelineRouter.get("/", async (_req, res) => {
    res.json(await pipelineService.getReport());
});
