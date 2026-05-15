import { useQuery } from "@tanstack/react-query";
import type { Lead } from "@/types";
import { LeadRow } from "./lead-row";
import { fetchLeads } from "@/api/leads";
import { QUERY_KEYS } from "@/api/query-keys";

export function Leads() {
    const { data: leads = [] } = useQuery<Lead[]>({ queryKey: QUERY_KEYS.leads, queryFn: fetchLeads });

    return (
        <div className="w-full">
            <h2 className="text-xl font-bold">Leads</h2>
            <table className="table-auto w-full">
                <thead>
                    <tr>
                        <th></th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Age</th>
                        <th>Phone Number</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map(lead => (
                        <LeadRow lead={lead} key={lead.id} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
