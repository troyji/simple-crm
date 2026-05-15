import { apiClient } from "./client";
import type { AppSetting } from "../types";

export const fetchSettings = () => apiClient.get<AppSetting[]>("/settings").then(r => r.data);
export const saveSetting = ({ key, value }: { key: string; value: string }) =>
    apiClient.put<AppSetting>(`/settings/${key}`, { value }).then(r => r.data);
