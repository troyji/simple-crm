import { apiClient } from "./client";
import type { Opportunity } from "../types";

export const fetchOpportunities = () => apiClient.get<Opportunity[]>("/opportunities").then(r => r.data);
export const deleteOpportunity = (id: number) => apiClient.delete(`/opportunities/${id}`).then(r => r.data);
