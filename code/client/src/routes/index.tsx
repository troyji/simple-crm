import { createFileRoute } from "@tanstack/react-router";
import { Leads } from "@/features/leads/leads";

export const Route = createFileRoute("/")({
    component: () => <Leads />,
});
