import { createFileRoute } from "@tanstack/react-router";
import { Pipeline } from "../pipeline";

export const Route = createFileRoute("/pipeline")({
    component: Pipeline,
});
