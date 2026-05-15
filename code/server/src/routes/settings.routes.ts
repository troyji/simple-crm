import * as express from "express";
import { settingsService } from "../services/settings.service";

export const settingsRouter = express.Router();

settingsRouter.get("/", async (_req, res) => {
    res.json(await settingsService.list());
});

settingsRouter.put("/:key", async (req, res) => {
    const setting = await settingsService.upsert(req.params.key, req.body.value);
    res.json(setting);
});
