import { AppDataSource } from "../data-source";
import { Stage } from "../entity/Stage";
import { Opportunity } from "../entity/Opportunity";
import { settingsService } from "./settings.service";
import { computeExpectedValue } from "./expected-value";

class PipelineService {
    private stageRepo = AppDataSource.getRepository(Stage);
    private oppRepo = AppDataSource.getRepository(Opportunity);

    async getReport() {
        const [stages, opportunities, settings] = await Promise.all([
            this.stageRepo.find({ order: { order: "ASC" } }),
            this.oppRepo.find(),
            settingsService.getOpportunitySettings(),
        ]);

        let totalValue = 0;
        let expectedValue = 0;

        const byStage = stages.map(stage => {
            const stageOpps = opportunities.filter(opp => opp.stage.id === stage.id);
            const stageTotal = stageOpps.reduce((sum, opp) => sum + opp.value, 0);
            const stageExpected = stageOpps.reduce((sum, opp) => sum + computeExpectedValue(opp.value, opp.stage, settings), 0);
            totalValue += stageTotal;
            expectedValue += stageExpected;
            return { stage, count: stageOpps.length, totalValue: stageTotal, expectedValue: stageExpected };
        });

        return { totalValue, expectedValue, byStage };
    }
}

export const pipelineService = new PipelineService();
