import { createFileRoute } from "@tanstack/react-router";
import { ManageFields } from "@/features/settings/manage-fields";
import { ManageStages } from "@/features/settings/manage-stages";
import { ManageSettings } from "@/features/settings/manage-settings";

export const Route = createFileRoute("/settings")({
    component: () => (
        <>
            <ManageFields />
            <ManageStages />
            <ManageSettings />
        </>
    ),
});
