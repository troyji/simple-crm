export interface Lead {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    phoneNumber: string;
    customFields?: Record<string, string | number>;
}

export interface CustomField {
    id: number;
    name: string;
    label: string;
    entity?: string;
    type?: string;
}

export interface Stage {
    id: number;
    name: string;
    status: "pending" | "won" | "lost";
    conversionLikelihood: number;
    order: number;
}

export interface Opportunity {
    id: number;
    lead: Lead;
    stage: Stage;
    value: number;
    name?: string;
    expectedCloseDate?: string | null;
    customFields?: Record<string, string | number>;
}

export interface AppSetting {
    key: string;
    value: string;
}

export interface PipelineReport {
    totalValue: number;
    expectedValue: number;
    byStage: {
        stage: Stage;
        count: number;
        totalValue: number;
        expectedValue: number;
    }[];
}
