import * as express from "express";
import { settingsService } from "../services/settings.service";
import { stagesService } from "../services/stages.service";

export const settingsRouter = express.Router();

settingsRouter.get("/", async (_req, res) => {
    res.json(await settingsService.list());
});

settingsRouter.put("/:key", async (req, res) => {
    const setting = await settingsService.upsert(req.params.key, req.body.value);

    if (req.params.key === "wonStageLikelihood" || req.params.key === "lostStageLikelihood") {
        const status = req.params.key === "wonStageLikelihood" ? "won" : "lost";
        await stagesService.recomputeWonLostStageTotals(status, parseFloat(req.body.value));
    }

    res.json(setting);
});
