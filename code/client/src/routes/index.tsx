import { createFileRoute } from "@tanstack/react-router";
import { Leads } from "../leads";
import { AddLead } from "../add-lead";

export const Route = createFileRoute("/")({
    component: () => (
        <>
            <Leads />
            <AddLead />
        </>
    ),
});
