import { createFileRoute } from "@tanstack/react-router";
import { Forecast } from "@/features/forecast/forecast";

export const Route = createFileRoute("/forecast")({
    component: Forecast,
});
