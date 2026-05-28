import { AppDataSource } from "./data-source";
import { seedDatabase } from "./seed";
import { createApp } from "./app";
import { backfillOpportunityPositions } from "./services/opportunities.service";

const run = async () => {
    await AppDataSource.initialize();
    await backfillOpportunityPositions();
    await seedDatabase();
    const app = createApp();
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
};

run().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    process.exit(1);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
});
