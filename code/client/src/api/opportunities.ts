import { apiClient } from "./client";
import type { Opportunity } from "../types";

export interface OpportunityInput {
    leadId: number;
    stageId: number;
    value: number;
    name?: string;
    expectedCloseDate?: string | null;
    customFields?: Record<string, string | number>;
}

export interface OpportunityUpdateInput {
    stageId?: number;
    value?: number;
    name?: string;
    expectedCloseDate?: string | null;
    customFields?: Record<string, string | number>;
}

export const fetchOpportunities = () => apiClient.get<Opportunity[]>("/opportunities").then(r => r.data);
export const createOpportunity = (input: OpportunityInput) => apiClient.post<Opportunity>("/opportunities", input).then(r => r.data);
export const updateOpportunity = ({ id, input }: { id: number; input: OpportunityUpdateInput }) =>
    apiClient.put<Opportunity>(`/opportunities/${id}`, input).then(r => r.data);
export const deleteOpportunity = (id: number) => apiClient.delete(`/opportunities/${id}`).then(r => r.data);
