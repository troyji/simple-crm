import * as express from "express";
import { pipelineService } from "../services/pipeline.service";

export const pipelineRouter = express.Router();

pipelineRouter.get("/", async (_req, res) => {
    res.json(await pipelineService.getReport());
});

pipelineRouter.post("/move", async (req, res) => {
    const { opportunityId, toStageId, toIndex } = req.body ?? {};
    const opp = await pipelineService.move({ opportunityId, toStageId, toIndex });
    res.json(opp);
});
