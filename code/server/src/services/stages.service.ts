import { AppDataSource } from "../data-source";
import { Stage } from "../entity/Stage";
import { Opportunity } from "../entity/Opportunity";

export interface StageInput {
    name: string;
    status: "pending" | "won" | "lost";
    conversionLikelihood: number;
    order?: number;
}

class StagesService {
    private repo = AppDataSource.getRepository(Stage);

    async list(): Promise<Stage[]> {
        return this.repo.find({ order: { order: "ASC" } });
    }

    async create(input: StageInput): Promise<Stage> {
        const maxOrder = await this.repo
            .createQueryBuilder("stage")
            .select("MAX(stage.order)", "max")
            .getRawOne<{ max: number | null }>();
        const stage = Object.assign(new Stage(), {
            ...input,
            order: (maxOrder?.max ?? 0) + 1,
        });
        return this.repo.save(stage);
    }

    async update(id: number, input: StageInput): Promise<Stage | null> {
        const stage = await this.repo.findOne({ where: { id } });
        if (!stage) return null;
        Object.assign(stage, input);
        return this.repo.save(stage);
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }

    async recomputeWonLostStageTotals(status: "won" | "lost", newLikelihood: number): Promise<void> {
        const stages = await this.repo.find({ where: { status } });
        const oppRepo = AppDataSource.getRepository(Opportunity);
        for (const stage of stages) {
            const opps = await oppRepo.find({ where: { stage: { id: stage.id } } });
            stage.expectedValue = opps.reduce((sum, opp) => sum + opp.value * newLikelihood, 0);
            await this.repo.save(stage);
        }
    }
}

export const stagesService = new StagesService();
