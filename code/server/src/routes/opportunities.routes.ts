import * as express from "express";
import { opportunitiesService } from "../services/opportunities.service";

export const opportunitiesRouter = express.Router();

opportunitiesRouter.get("/", async (_req, res) => {
    res.json(await opportunitiesService.list());
});

opportunitiesRouter.post("/", async (req, res) => {
    try {
        const opp = await opportunitiesService.create(req.body);
        res.json(opp);
    } catch (e) {
        res.status(400).json({ error: (e as Error).message });
    }
});

opportunitiesRouter.put("/:id", async (req, res) => {
    try {
        const opp = await opportunitiesService.update(Number(req.params.id), req.body);
        if (!opp) return res.status(404).json({ error: "Opportunity not found" });
        res.json(opp);
    } catch (e) {
        res.status(400).json({ error: (e as Error).message });
    }
});

opportunitiesRouter.delete("/:id", async (req, res) => {
    await opportunitiesService.remove(Number(req.params.id));
    res.json({ success: true });
});
