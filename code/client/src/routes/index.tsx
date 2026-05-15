import { createFileRoute } from "@tanstack/react-router";
import { Leads } from "@/features/leads/leads";
import { AddLead } from "@/features/leads/add-lead";

export const Route = createFileRoute("/")({
    component: () => (
        <>
            <Leads />
            <AddLead />
        </>
    ),
});
