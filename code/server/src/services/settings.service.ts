import { AppDataSource } from "../data-source";
import { AppSetting } from "../entity/AppSetting";

class SettingsService {
    private repo = AppDataSource.getRepository(AppSetting);

    async list(): Promise<AppSetting[]> {
        return this.repo.find();
    }

    async getNumber(key: string, defaultValue: number): Promise<number> {
        const setting = await this.repo.findOne({ where: { key } });
        if (!setting) return defaultValue;
        const parsed = parseFloat(setting.value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    async getOpportunitySettings(): Promise<{ minValue: number; wonLikelihood: number; lostLikelihood: number }> {
        const [minValue, wonLikelihood, lostLikelihood] = await Promise.all([
            this.getNumber("minimumOpportunityValue", 0),
            this.getNumber("wonStageLikelihood", 1),
            this.getNumber("lostStageLikelihood", 0),
        ]);
        return { minValue, wonLikelihood, lostLikelihood };
    }

    async upsert(key: string, value: string): Promise<AppSetting> {
        const existing = await this.repo.findOne({ where: { key } });
        if (!existing) {
            return this.repo.save(Object.assign(new AppSetting(), { key, value }));
        }
        existing.value = value;
        return this.repo.save(existing);
    }
}

export const settingsService = new SettingsService();
