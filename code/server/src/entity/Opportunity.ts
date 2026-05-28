import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Lead } from "./Lead";
import { Stage } from "./Stage";

@Entity()
export class Opportunity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Lead, lead => lead.opportunities, { eager: true })
    lead: Lead;

    @ManyToOne(() => Stage, stage => stage.opportunities, { eager: true })
    stage: Stage;

    @Column("real")
    value: number;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    expectedCloseDate: string | null = null;

    @Column("simple-json", { nullable: true })
    customFields: Record<string, string | number> = {};

    @Column("real", { nullable: true })
    position: number | null = null;
}
