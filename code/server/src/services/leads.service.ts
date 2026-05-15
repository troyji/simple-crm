import { AppDataSource } from "../data-source";
import { Lead } from "../entity/Lead";

export interface LeadInput {
    firstName: string;
    lastName: string;
    age: number;
    phoneNumber: string;
    customFields?: Record<string, string | number>;
}

class LeadsService {
    private repo = AppDataSource.getRepository(Lead);

    async list(): Promise<Lead[]> {
        return this.repo.find();
    }

    async create(input: LeadInput): Promise<Lead> {
        const lead = Object.assign(new Lead(), {
            ...input,
            customFields: input.customFields ?? {},
        });
        return this.repo.save(lead);
    }

    async update(id: number, input: LeadInput): Promise<Lead | null> {
        const lead = await this.repo.findOne({ where: { id } });
        if (!lead) return null;
        Object.assign(lead, { ...input, customFields: input.customFields ?? {} });
        return this.repo.save(lead);
    }
}

export const leadsService = new LeadsService();
