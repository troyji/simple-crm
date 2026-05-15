import { apiClient } from "./client";
import type { Lead } from "../types";

export interface LeadInput {
    firstName: string;
    lastName: string;
    age: number | string;
    phoneNumber: string;
    customFields?: Record<string, string | number>;
}

export const fetchLeads = () => apiClient.get<Lead[]>("/leads").then(r => r.data);
export const createLead = (input: LeadInput) => apiClient.post<Lead>("/leads", input).then(r => r.data);
export const updateLead = ({ id, input }: { id: number; input: LeadInput }) =>
    apiClient.put<Lead>(`/leads/${id}`, input).then(r => r.data);
