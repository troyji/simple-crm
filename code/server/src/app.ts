import * as express from "express";
import { leadsRouter } from "./routes/leads.routes";
import { opportunitiesRouter } from "./routes/opportunities.routes";
import { stagesRouter } from "./routes/stages.routes";
import { customFieldsRouter } from "./routes/custom-fields.routes";
import { settingsRouter } from "./routes/settings.routes";
import { pipelineRouter } from "./routes/pipeline.routes";
import { notFoundHandler, globalErrorHandler } from "./middleware/errorHandler";

export function createApp() {
    const app = express();
    app.use(express.json());

    app.use("/leads", leadsRouter);
    app.use("/opportunities", opportunitiesRouter);
    app.use("/stages", stagesRouter);
    app.use("/custom-fields", customFieldsRouter);
    app.use("/settings", settingsRouter);
    app.use("/pipeline", pipelineRouter);

    app.use(notFoundHandler);
    app.use(globalErrorHandler);

    return app;
}
