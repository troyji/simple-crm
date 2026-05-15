import { AppDataSource } from "../data-source";
import { Stage } from "../entity/Stage";

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
}

export const stagesService = new StagesService();
