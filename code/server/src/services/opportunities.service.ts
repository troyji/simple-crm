import { IsNull } from "typeorm";
import { AppDataSource } from "../data-source";
import { Opportunity } from "../entity/Opportunity";
import { Lead } from "../entity/Lead";
import { Stage } from "../entity/Stage";
import { settingsService } from "./settings.service";
import { NotFoundError, ValidationError } from "../errors";
import { keyBetween } from "./pipeline-position";

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

    async nextPositionForStage(stageId: number): Promise<string> {
        const last = await this.repo.findOne({
            where: { stage: { id: stageId } },
            order: { position: "DESC" },
        });
        return keyBetween(last?.position ?? null, null);
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
            position: await this.nextPositionForStage(stage.id),
        });
        return this.repo.save(opp);
    }

    async update(id: number, input: UpdateOpportunityInput): Promise<Opportunity | null> {
        const settings = await settingsService.getOpportunitySettings();
        const opp = await this.repo.findOne({ where: { id } });
        if (!opp) return null;

        if (input.stageId !== undefined && input.stageId !== opp.stage.id) {
            const newStage = await this.stageRepo.findOne({ where: { id: input.stageId } });
            if (!newStage) throw new NotFoundError("Stage not found");
            opp.stage = newStage;
            opp.position = await this.nextPositionForStage(newStage.id);
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

export async function backfillOpportunityPositions(): Promise<void> {
    const repo = AppDataSource.getRepository(Opportunity);
    const missing = await repo.find({ where: { position: IsNull() }, order: { id: "ASC" } });
    if (missing.length === 0) return;

    // Seed each stage's cursor from any existing max position so we always append.
    const lastByStage = new Map<number, string | null>();
    for (const opp of missing) {
        const stageId = opp.stage.id;
        if (lastByStage.has(stageId)) continue;
        const top = await repo.findOne({
            where: { stage: { id: stageId } },
            order: { position: "DESC" },
        });
        lastByStage.set(stageId, top?.position ?? null);
    }

    for (const opp of missing) {
        const stageId = opp.stage.id;
        const next = keyBetween(lastByStage.get(stageId) ?? null, null);
        lastByStage.set(stageId, next);
        opp.position = next;
    }
    await repo.save(missing);
    console.log(`Backfilled position for ${missing.length} opportunit${missing.length === 1 ? "y" : "ies"}.`);
}
