import * as express from "express";
import { stagesService } from "../services/stages.service";
import { NotFoundError } from "../errors";

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
    if (!stage) throw new NotFoundError("Stage not found");
    res.json(stage);
});

stagesRouter.delete("/:id", async (req, res) => {
    await stagesService.remove(Number(req.params.id));
    res.json({ success: true });
});
