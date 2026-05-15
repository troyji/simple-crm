import { AppDataSource } from "../data-source";
import { Opportunity } from "../entity/Opportunity";
import { Lead } from "../entity/Lead";
import { Stage } from "../entity/Stage";
import { settingsService } from "./settings.service";
import { computeExpectedValue } from "./expected-value";
import { NotFoundError, ValidationError } from "../errors";

export interface CreateOpportunityInput {
    leadId: number;
    stageId: number;
    value: number;
    name?: string;
    customFields?: Record<string, unknown>;
}

export interface UpdateOpportunityInput {
    stageId?: number;
    value?: number;
    name?: string;
    customFields?: Record<string, unknown>;
}

class OpportunitiesService {
    private repo = AppDataSource.getRepository(Opportunity);
    private stageRepo = AppDataSource.getRepository(Stage);
    private leadRepo = AppDataSource.getRepository(Lead);

    async list(): Promise<Opportunity[]> {
        return this.repo.find();
    }

    async create(input: CreateOpportunityInput): Promise<Opportunity> {
        const settings = await settingsService.getOpportunitySettings();
        if (input.value < settings.minValue) {
            throw new ValidationError(`Value must be at least ${settings.minValue}`);
        }

        const lead = await this.leadRepo.findOne({ where: { id: input.leadId } });
        if (!lead) throw new NotFoundError("Lead not found");

        const stage = await this.stageRepo.findOne({ where: { id: input.stageId } });
        if (!stage) throw new NotFoundError("Stage not found");

        const opp = Object.assign(new Opportunity(), {
            lead,
            stage,
            value: input.value,
            name: input.name,
            customFields: input.customFields ?? {},
        });
        opp.expectedValue = computeExpectedValue(opp.value, stage, settings);
        await this.repo.save(opp);

        stage.expectedValue = (stage.expectedValue || 0) + opp.expectedValue;
        await this.stageRepo.save(stage);

        return opp;
    }

    async update(id: number, input: UpdateOpportunityInput): Promise<Opportunity | null> {
        const settings = await settingsService.getOpportunitySettings();
        const opp = await this.repo.findOne({ where: { id } });
        if (!opp) return null;

        const oldExpectedValue = opp.expectedValue || 0;
        const oldStage = opp.stage;

        if (input.stageId !== undefined) {
            const newStage = await this.stageRepo.findOne({ where: { id: input.stageId } });
            if (!newStage) throw new NotFoundError("Stage not found");
            opp.stage = newStage;
        }
        if (input.value !== undefined) {
            if (input.value < settings.minValue) {
                throw new ValidationError(`Value must be at least ${settings.minValue}`);
            }
            opp.value = input.value;
        }
        if (input.name !== undefined) opp.name = input.name;
        if (input.customFields !== undefined) opp.customFields = input.customFields;

        opp.expectedValue = computeExpectedValue(opp.value, opp.stage, settings);
        await this.repo.save(opp);

        if (oldStage.id !== opp.stage.id) {
            oldStage.expectedValue = (oldStage.expectedValue || 0) - oldExpectedValue;
            await this.stageRepo.save(oldStage);
            opp.stage.expectedValue = (opp.stage.expectedValue || 0) + opp.expectedValue;
            await this.stageRepo.save(opp.stage);
        } else {
            opp.stage.expectedValue = (opp.stage.expectedValue || 0) - oldExpectedValue + opp.expectedValue;
            await this.stageRepo.save(opp.stage);
        }

        return opp;
    }

    async remove(id: number): Promise<void> {
        const opp = await this.repo.findOne({ where: { id } });
        if (opp) {
            opp.stage.expectedValue = (opp.stage.expectedValue || 0) - (opp.expectedValue || 0);
            await this.stageRepo.save(opp.stage);
            await this.repo.delete(id);
        }
    }
}

export const opportunitiesService = new OpportunitiesService();
