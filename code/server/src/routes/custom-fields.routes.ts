import * as express from "express";
import { customFieldsService } from "../services/custom-fields.service";

export const customFieldsRouter = express.Router();

customFieldsRouter.get("/", async (_req, res) => {
    res.json(await customFieldsService.list());
});

customFieldsRouter.post("/", async (req, res) => {
    const field = await customFieldsService.create(req.body);
    res.json(field);
});

customFieldsRouter.delete("/:id", async (req, res) => {
    await customFieldsService.remove(Number(req.params.id));
    res.json({ success: true });
});
