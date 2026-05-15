import { Stage } from "../entity/Stage";

export interface LikelihoodSettings {
    wonLikelihood: number;
    lostLikelihood: number;
}

export function resolveLikelihood(stage: Stage, settings: LikelihoodSettings): number {
    if (stage.status === "won") return settings.wonLikelihood;
    if (stage.status === "lost") return settings.lostLikelihood;
    return stage.conversionLikelihood;
}

export function computeExpectedValue(value: number, stage: Stage, settings: LikelihoodSettings): number {
    return value * resolveLikelihood(stage, settings);
}
