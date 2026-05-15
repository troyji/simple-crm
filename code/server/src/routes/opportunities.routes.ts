import * as express from "express";
import { opportunitiesService } from "../services/opportunities.service";
import { NotFoundError } from "../errors";

export const opportunitiesRouter = express.Router();

opportunitiesRouter.get("/", async (_req, res) => {
    res.json(await opportunitiesService.list());
});

opportunitiesRouter.post("/", async (req, res) => {
    const opp = await opportunitiesService.create(req.body);
    res.json(opp);
});

opportunitiesRouter.put("/:id", async (req, res) => {
    const opp = await opportunitiesService.update(Number(req.params.id), req.body);
    if (!opp) throw new NotFoundError("Opportunity not found");
    res.json(opp);
});

opportunitiesRouter.delete("/:id", async (req, res) => {
    await opportunitiesService.remove(Number(req.params.id));
    res.json({ success: true });
});
