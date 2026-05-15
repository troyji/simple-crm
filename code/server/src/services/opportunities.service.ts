import { AppDataSource } from "../data-source";
import { Opportunity } from "../entity/Opportunity";
import { Lead } from "../entity/Lead";
import { Stage } from "../entity/Stage";
import { settingsService } from "./settings.service";
import { NotFoundError, ValidationError } from "../errors";

export interface CreateOpportunityInput {
    leadId: number;
    stageId: number;
    value: number;
    name?: string;
    expectedCloseDate?: string | null;
    customFields?: Record<string, string | number>;
}

export interface UpdateOpportunityInput {
    stageId?: number;
    value?: number;
    name?: string;
    expectedCloseDate?: string | null;
    customFields?: Record<string, string | number>;
}

class OpportunitiesService {
    private repo = AppDataSource.getRepository(Opportunity);
    private leadRepo = AppDataSource.getRepository(Lead);
    private stageRepo = AppDataSource.getRepository(Stage);

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
            expectedCloseDate: input.expectedCloseDate ?? null,
            customFields: input.customFields ?? {},
        });
        return this.repo.save(opp);
    }

    async update(id: number, input: UpdateOpportunityInput): Promise<Opportunity | null> {
        const settings = await settingsService.getOpportunitySettings();
        const opp = await this.repo.findOne({ where: { id } });
        if (!opp) return null;

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
        if (input.expectedCloseDate !== undefined) opp.expectedCloseDate = input.expectedCloseDate || null;
        if (input.customFields !== undefined) opp.customFields = input.customFields;

        return this.repo.save(opp);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}

export const opportunitiesService = new OpportunitiesService();
