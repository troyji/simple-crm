import { apiClient } from "./client";
import type { Stage } from "../types";

export interface StageInput {
    name: string;
    status: "pending" | "won" | "lost";
    conversionLikelihood: number;
}

export const fetchStages = () => apiClient.get<Stage[]>("/stages").then(r => r.data);
export const createStage = (input: StageInput) => apiClient.post<Stage>("/stages", input).then(r => r.data);
export const updateStage = ({ id, input }: { id: number; input: StageInput }) =>
    apiClient.put<Stage>(`/stages/${id}`, input).then(r => r.data);
export const deleteStage = (id: number) => apiClient.delete(`/stages/${id}`).then(r => r.data);
