import { apiClient } from "./client";
import type { CustomField } from "../types";

export interface CustomFieldInput {
    name: string;
    label: string;
    entity: string;
    type: string;
}

export const fetchCustomFields = () => apiClient.get<CustomField[]>("/custom-fields").then(r => r.data);
export const createCustomField = (input: CustomFieldInput) =>
    apiClient.post<CustomField>("/custom-fields", input).then(r => r.data);
export const deleteCustomField = (id: number) => apiClient.delete(`/custom-fields/${id}`).then(r => r.data);
