import { createFileRoute } from "@tanstack/react-router";
import { Pipeline } from "@/features/pipeline/pipeline";

export const Route = createFileRoute("/pipeline")({
    component: Pipeline,
});
