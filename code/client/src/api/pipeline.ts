import { apiClient } from "./client";
import type { PipelineReport } from "../types";

export const fetchPipeline = () => apiClient.get<PipelineReport>("/pipeline").then(r => r.data);
