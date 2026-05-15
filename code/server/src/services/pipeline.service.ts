import { AppDataSource } from "../data-source";
import { Stage } from "../entity/Stage";
import { Opportunity } from "../entity/Opportunity";

class PipelineService {
    private stageRepo = AppDataSource.getRepository(Stage);
    private oppRepo = AppDataSource.getRepository(Opportunity);

    async getReport() {
        const stages = await this.stageRepo.find({ order: { order: "ASC" } });
        const opportunities = await this.oppRepo.find();

        let totalValue = 0;
        let expectedValue = 0;

        const byStage = stages.map(stage => {
            const stageOpps = opportunities.filter(opp => opp.stage.id === stage.id);
            const stageTotal = stageOpps.reduce((sum, opp) => sum + opp.value, 0);
            const stageExpected = stageOpps.reduce((sum, opp) => sum + (opp.expectedValue ?? 0), 0);
            totalValue += stageTotal;
            expectedValue += stageExpected;
            return { stage, count: stageOpps.length, totalValue: stageTotal, expectedValue: stageExpected };
        });

        return { totalValue, expectedValue, byStage };
    }
}

export const pipelineService = new PipelineService();
