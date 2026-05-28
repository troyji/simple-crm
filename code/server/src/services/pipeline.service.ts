import { AppDataSource } from "../data-source";
import { Stage } from "../entity/Stage";
import { Opportunity } from "../entity/Opportunity";
import { settingsService } from "./settings.service";
import { computeExpectedValue } from "./expected-value";
import { NotFoundError, ValidationError } from "../errors";
import { computeInsertPosition, needsRenormalization } from "./pipeline-position";

export interface MoveOpportunityInput {
    opportunityId: number;
    toStageId: number;
    toIndex: number;
}

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

    async move(input: MoveOpportunityInput): Promise<Opportunity> {
        if (!Number.isInteger(input.opportunityId) || !Number.isInteger(input.toStageId)) {
            throw new ValidationError("opportunityId and toStageId must be integers");
        }
        if (typeof input.toIndex !== "number" || !Number.isFinite(input.toIndex)) {
            throw new ValidationError("toIndex must be a finite number");
        }

        const opp = await this.oppRepo.findOne({ where: { id: input.opportunityId } });
        if (!opp) throw new NotFoundError("Opportunity not found");

        const toStage = await this.stageRepo.findOne({ where: { id: input.toStageId } });
        if (!toStage) throw new NotFoundError("Stage not found");

        let others = await this.oppRepo
            .createQueryBuilder("opp")
            .where("opp.stageId = :stageId", { stageId: toStage.id })
            .andWhere("opp.id <> :id", { id: opp.id })
            .orderBy("opp.position", "ASC")
            .getMany();
        // Treat any nulls defensively as 0 — backfill should have populated everything.
        const othersForCompute = others.map(o => ({ position: o.position ?? 0 }));

        if (needsRenormalization(othersForCompute, input.toIndex)) {
            for (let i = 0; i < others.length; i++) {
                others[i].position = i + 1;
            }
            await this.oppRepo.save(others);
            othersForCompute.forEach((o, i) => (o.position = i + 1));
        }

        const newPosition = computeInsertPosition(othersForCompute, input.toIndex);
        opp.stage = toStage;
        opp.position = newPosition;
        return this.oppRepo.save(opp);
    }
}

export const pipelineService = new PipelineService();
