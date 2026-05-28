import { apiClient } from "./client";
import type { Opportunity, PipelineReport } from "../types";

export const fetchPipeline = () => apiClient.get<PipelineReport>("/pipeline").then(r => r.data);

export interface MoveOpportunityInput {
    opportunityId: number;
    toStageId: number;
    toIndex: number;
}

export const movePipelineOpportunity = (input: MoveOpportunityInput) =>
    apiClient.post<Opportunity>("/pipeline/move", input).then(r => r.data);
