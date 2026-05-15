import * as express from "express";
import { leadsService } from "../services/leads.service";

export const leadsRouter = express.Router();

leadsRouter.get("/", async (_req, res) => {
    res.json(await leadsService.list());
});

leadsRouter.post("/", async (req, res) => {
    const lead = await leadsService.create(req.body);
    res.json(lead);
});

leadsRouter.put("/:id", async (req, res) => {
    const lead = await leadsService.update(Number(req.params.id), req.body);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
});
