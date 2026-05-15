import { createFileRoute } from "@tanstack/react-router";
import { ManageFields } from "../manage-fields";
import { ManageStages } from "../manage-stages";
import { ManageSettings } from "../manage-settings";

export const Route = createFileRoute("/settings")({
    component: () => (
        <>
            <ManageFields />
            <ManageStages />
            <ManageSettings />
        </>
    ),
});
