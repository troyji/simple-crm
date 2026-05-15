import { AppDataSource } from "./data-source";
import { seedDatabase } from "./seed";
import { createApp } from "./app";

const run = async () => {
    await AppDataSource.initialize();
    await seedDatabase();
    const app = createApp();
    app.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
};

run();
