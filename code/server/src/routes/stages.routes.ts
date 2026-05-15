import * as express from "express";
import { stagesService } from "../services/stages.service";

export const stagesRouter = express.Router();

stagesRouter.get("/", async (_req, res) => {
    res.json(await stagesService.list());
});

stagesRouter.post("/", async (req, res) => {
    const stage = await stagesService.create(req.body);
    res.json(stage);
});

stagesRouter.put("/:id", async (req, res) => {
    const stage = await stagesService.update(Number(req.params.id), req.body);
    if (!stage) return res.status(404).json({ error: "Stage not found" });
    res.json(stage);
});

stagesRouter.delete("/:id", async (req, res) => {
    await stagesService.remove(Number(req.params.id));
    res.json({ success: true });
});
