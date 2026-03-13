import { useMemo } from "react";
import TopBar from "@/components/TopBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

const neutralPalette = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(228, 60%, 75%)",
  "hsl(210, 15%, 75%)",
  "hsl(160, 60%, 45%)",
  "hsl(38, 92%, 55%)",
];

const stageLabel = {
  inquiry: "Inquiry",
  assessment_scheduled: "Assessment Scheduled",
  assessment_completed: "Assessment Completed",
  proposal_sent: "Proposal Sent",
  pending_decision: "Pending Decision",
  closed: "Closed",
};

const funnelOrder = [
  "inquiry",
  "assessment_scheduled",
  "assessment_completed",
  "proposal_sent",
  "pending_decision",
  "closed",
];

export default function Dashboard({ leads = [] }) {
  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage && l.stage !== "rejected" && l.stage !== "closed"),
    [leads]
  );

  const leadSources = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      const src = l.source || l.intakeNote?.leadSource || "Other";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const totalLeads = leadSources.reduce((s, d) => s + d.value, 0);

  const funnel = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      if (l.stage && l.stage !== "rejected") {
        counts[l.stage] = (counts[l.stage] || 0) + 1;
      }
    });
    return funnelOrder
      .map((key) => ({ stage: stageLabel[key], count: counts[key] || 0 }))
      .filter((s) => s.count > 0);
  }, [leads]);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" subtitle="At a glance overview" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Active Leads metric */}
        <div className="max-w-xs">
          <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Active Leads</span>
              <Users className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="font-display font-bold text-foreground text-2xl">{activeLeads.length}</p>
            <span className="text-xs text-muted-foreground">
              {leads.length} total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Sources */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Lead Sources</h3>
            <p className="text-xs text-muted-foreground mb-4">{totalLeads} total leads</p>
            {totalLeads > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {leadSources.map((_, index) => (
                          <Cell key={index} fill={neutralPalette[index % neutralPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} leads (${((value / totalLeads) * 100).toFixed(0)}%)`, name]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {leadSources.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: neutralPalette[i % neutralPalette.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-medium text-foreground">{((d.value / totalLeads) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No leads yet</p>
            )}
          </div>

          {/* Sales Funnel */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Sales Funnel</h3>
            <p className="text-xs text-muted-foreground mb-4">Current pipeline</p>
            {leads.length > 0 ? (
              <div className="flex flex-col items-center gap-1">
                {funnel.map((stage, i) => {
                  const maxCount = Math.max(...funnel.map((s) => s.count), 1);
                  const minWidth = 25;
                  const pct = stage.count > 0 ? minWidth + ((100 - minWidth) * stage.count) / maxCount : minWidth;
                  return (
                    <div
                      key={stage.stage}
                      className="flex items-center justify-center text-xs font-medium text-primary-foreground rounded transition-all py-2"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `hsl(var(--primary) / ${1 - i * 0.12})`,
                      }}
                    >
                      {stage.stage} ({stage.count})
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No leads yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
