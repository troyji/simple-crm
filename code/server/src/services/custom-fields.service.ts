import { AppDataSource } from "../data-source";
import { CustomField } from "../entity/CustomField";
import { ConflictError } from "../errors";

export interface CustomFieldInput {
    name: string;
    label: string;
    entity?: string;
    type?: string;
}

class CustomFieldsService {
    private repo = AppDataSource.getRepository(CustomField);

    async list(): Promise<CustomField[]> {
        return this.repo.find();
    }

    async create(input: CustomFieldInput): Promise<CustomField> {
        const field = Object.assign(new CustomField(), input);
        try {
            return await this.repo.save(field);
        } catch {
            throw new ConflictError("Field name already exists");
        }
    }

    async remove(id: number): Promise<void> {
        await this.repo.delete(id);
    }
}

export const customFieldsService = new CustomFieldsService();
