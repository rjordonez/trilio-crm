import { useState } from "react";
import TopBar from "@/components/TopBar";
import { leadSourceData, funnelData } from "@/data/mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, CalendarDays, TrendingUp, Home, Columns2 } from "lucide-react";

const neutralPalette = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(228, 60%, 75%)",
  "hsl(210, 15%, 75%)",
];

const periods = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "this-quarter", label: "This Quarter" },
  { key: "last-quarter", label: "Last Quarter" },
  { key: "ytd", label: "YTD" },
  { key: "last-year", label: "Last Year" },
];

// Mock data per period — values shift realistically
const periodData = {
  "this-month": {
    metrics: [
      { label: "Active Leads", value: 24, icon: Users, change: "+12%", positive: true },
      { label: "Tours This Week", value: 8, icon: CalendarDays, change: "-5%", positive: false },
      { label: "Occupancy Rate", value: "87%", icon: Home, change: "+3%", positive: true },
      { label: "Move-ins (MTD)", value: 5, icon: TrendingUp, change: "+25%", positive: true },
    ],
    leadSources: leadSourceData,
    funnel: funnelData,
  },
  "last-month": {
    metrics: [
      { label: "Active Leads", value: 21, icon: Users, change: "+5%", positive: true },
      { label: "Tours This Week", value: 9, icon: CalendarDays, change: "+10%", positive: true },
      { label: "Occupancy Rate", value: "84%", icon: Home, change: "+1%", positive: true },
      { label: "Move-ins (MTD)", value: 4, icon: TrendingUp, change: "+0%", positive: false },
    ],
    leadSources: [
      { name: "Digital Ads", value: 28 },
      { name: "Website", value: 20 },
      { name: "Phone Call", value: 22 },
      { name: "Walk-in", value: 12 },
      { name: "Referral", value: 14 },
    ],
    funnel: [
      { stage: "Inquiry", count: 10 },
      { stage: "Connection", count: 6 },
      { stage: "Pre-Tour", count: 4 },
      { stage: "Post-Tour", count: 2 },
      { stage: "Deposit", count: 1 },
      { stage: "Move-in", count: 1 },
    ],
  },
  "this-quarter": {
    metrics: [
      { label: "Active Leads", value: 68, icon: Users, change: "+18%", positive: true },
      { label: "Tours This Week", value: 8, icon: CalendarDays, change: "+8%", positive: true },
      { label: "Occupancy Rate", value: "87%", icon: Home, change: "+5%", positive: true },
      { label: "Move-ins (QTD)", value: 14, icon: TrendingUp, change: "+22%", positive: true },
    ],
    leadSources: [
      { name: "Digital Ads", value: 88 },
      { name: "Website", value: 65 },
      { name: "Phone Call", value: 52 },
      { name: "Walk-in", value: 30 },
      { name: "Referral", value: 45 },
    ],
    funnel: [
      { stage: "Inquiry", count: 24 },
      { stage: "Connection", count: 16 },
      { stage: "Pre-Tour", count: 10 },
      { stage: "Post-Tour", count: 8 },
      { stage: "Deposit", count: 5 },
      { stage: "Move-in", count: 3 },
    ],
  },
  "last-quarter": {
    metrics: [
      { label: "Active Leads", value: 58, icon: Users, change: "+8%", positive: true },
      { label: "Tours This Week", value: 6, icon: CalendarDays, change: "-12%", positive: false },
      { label: "Occupancy Rate", value: "82%", icon: Home, change: "+2%", positive: true },
      { label: "Move-ins (QTD)", value: 11, icon: TrendingUp, change: "+10%", positive: true },
    ],
    leadSources: [
      { name: "Digital Ads", value: 72 },
      { name: "Website", value: 58 },
      { name: "Phone Call", value: 48 },
      { name: "Walk-in", value: 28 },
      { name: "Referral", value: 38 },
    ],
    funnel: [
      { stage: "Inquiry", count: 20 },
      { stage: "Connection", count: 12 },
      { stage: "Pre-Tour", count: 8 },
      { stage: "Post-Tour", count: 6 },
      { stage: "Deposit", count: 4 },
      { stage: "Move-in", count: 2 },
    ],
  },
  "ytd": {
    metrics: [
      { label: "Active Leads", value: 126, icon: Users, change: "+15%", positive: true },
      { label: "Tours This Week", value: 8, icon: CalendarDays, change: "+6%", positive: true },
      { label: "Occupancy Rate", value: "87%", icon: Home, change: "+7%", positive: true },
      { label: "Move-ins (YTD)", value: 25, icon: TrendingUp, change: "+20%", positive: true },
    ],
    leadSources: [
      { name: "Digital Ads", value: 156 },
      { name: "Website", value: 118 },
      { name: "Phone Call", value: 94 },
      { name: "Walk-in", value: 56 },
      { name: "Referral", value: 76 },
    ],
    funnel: [
      { stage: "Inquiry", count: 42 },
      { stage: "Connection", count: 28 },
      { stage: "Pre-Tour", count: 18 },
      { stage: "Post-Tour", count: 14 },
      { stage: "Deposit", count: 9 },
      { stage: "Move-in", count: 5 },
    ],
  },
  "last-year": {
    metrics: [
      { label: "Active Leads", value: 196, icon: Users, change: "-", positive: true },
      { label: "Tours This Week", value: 5, icon: CalendarDays, change: "-", positive: true },
      { label: "Occupancy Rate", value: "80%", icon: Home, change: "-", positive: true },
      { label: "Move-ins (Total)", value: 42, icon: TrendingUp, change: "-", positive: true },
    ],
    leadSources: [
      { name: "Digital Ads", value: 240 },
      { name: "Website", value: 180 },
      { name: "Phone Call", value: 168 },
      { name: "Walk-in", value: 96 },
      { name: "Referral", value: 116 },
    ],
    funnel: [
      { stage: "Inquiry", count: 72 },
      { stage: "Connection", count: 48 },
      { stage: "Pre-Tour", count: 32 },
      { stage: "Post-Tour", count: 24 },
      { stage: "Deposit", count: 16 },
      { stage: "Move-in", count: 10 },
    ],
  },
};

export default function Dashboard() {
  const [activePeriod, setActivePeriod] = useState("this-month");
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod, setComparePeriod] = useState("last-month");

  const data = periodData[activePeriod];

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" subtitle="At a glance overview" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Period filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setActivePeriod(p.key);
                if (comparePeriod === p.key) {
                  const other = periods.find((x) => x.key !== p.key);
                  if (other) setComparePeriod(other.key);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activePeriod === p.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="h-5 w-px bg-border mx-1" />
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              compareMode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Compare
          </button>
          {compareMode && (
            <select
              value={comparePeriod}
              onChange={(e) => setComparePeriod(e.target.value)}
              className="px-2 py-1.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border"
            >
              {periods
                .filter((p) => p.key !== activePeriod)
                .map((p) => (
                  <option key={p.key} value={p.key}>
                    vs {p.label}
                  </option>
                ))}
            </select>
          )}
        </div>

        {compareMode ? (
          <CompareView
            periodA={activePeriod}
            periodB={comparePeriod}
            dataA={data}
            dataB={periodData[comparePeriod]}
          />
        ) : (
          <SingleView data={data} />
        )}
      </div>
    </div>
  );
}

function SingleView({ data }) {
  const totalLeads = data.leadSources.reduce((s, d) => s + d.value, 0);

  return (
    <>
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((m) => (
          <MetricCard key={m.label} m={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadSourceCard sources={data.leadSources} totalLeads={totalLeads} />
        <FunnelAndKPIs funnel={data.funnel} />
      </div>
    </>
  );
}

function CompareView({ periodA, periodB, dataA, dataB }) {
  const labelA = periods.find((p) => p.key === periodA)?.label;
  const labelB = periods.find((p) => p.key === periodB)?.label;
  const totalA = dataA.leadSources.reduce((s, d) => s + d.value, 0);
  const totalB = dataB.leadSources.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Period A */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">{labelA}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dataA.metrics.map((m) => (
            <MetricCard key={m.label} m={m} compact />
          ))}
        </div>
        <LeadSourceCard sources={dataA.leadSources} totalLeads={totalA} compact />
        <FunnelAndKPIs funnel={dataA.funnel} compact />
      </div>

      {/* Period B */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <h3 className="text-sm font-semibold text-foreground">{labelB}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dataB.metrics.map((m) => (
            <MetricCard key={m.label} m={m} compact />
          ))}
        </div>
        <LeadSourceCard sources={dataB.leadSources} totalLeads={totalB} compact />
        <FunnelAndKPIs funnel={dataB.funnel} compact />
      </div>
    </div>
  );
}

function MetricCard({ m, compact }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
        <m.icon className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <p className={`font-display font-bold text-foreground ${compact ? "text-xl" : "text-2xl"}`}>{m.value}</p>
      <span className={`text-xs font-medium ${m.positive ? "text-primary" : "text-destructive"}`}>
        {m.change} vs prior
      </span>
    </div>
  );
}

function LeadSourceCard({ sources, totalLeads, compact }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
      <h3 className="font-display text-sm font-semibold text-foreground mb-1">Lead Sources</h3>
      <p className="text-xs text-muted-foreground mb-4">{totalLeads} total leads</p>
      <div className={compact ? "h-40" : "h-56"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sources}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 40 : 55}
              outerRadius={compact ? 65 : 85}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {sources.map((_, index) => (
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
        {sources.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: neutralPalette[i % neutralPalette.length] }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto font-medium text-foreground">{((d.value / totalLeads) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelAndKPIs({ funnel, compact }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
        <h3 className="font-display text-sm font-semibold text-foreground mb-1">Sales Funnel</h3>
        <p className="text-xs text-muted-foreground mb-4">Inquiries in period</p>
        <div className="flex flex-col items-center gap-1">
          {funnel.map((stage, i) => {
            const maxWidth = 100;
            const minWidth = 35;
            const pct = maxWidth - ((maxWidth - minWidth) / (funnel.length - 1)) * i;
            return (
              <div
                key={stage.stage}
                className={`flex items-center justify-center text-xs font-medium text-primary-foreground rounded transition-all ${compact ? "py-1.5" : "py-2"}`}
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
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ConversionCard
          label="Inquiry → Tour"
          value={(funnel[2].count / funnel[0].count) * 100}
          goal={30}
          compact={compact}
        />
        <ConversionCard
          label="Inquiry → MI"
          value={(funnel[5].count / funnel[0].count) * 100}
          goal={10}
          compact={compact}
        />
        <ConversionCard
          label="Tour → MI"
          value={funnel[2].count > 0 ? (funnel[5].count / funnel[2].count) * 100 : 0}
          goal={35}
          compact={compact}
        />
      </div>
    </div>
  );
}

function ConversionCard({ label, value, goal, compact }) {
  const aboveGoal = value >= goal;
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm text-center">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`font-display font-bold text-foreground ${compact ? "text-lg" : "text-xl"}`}>{value.toFixed(0)}%</p>
      <p className={`text-[11px] font-medium mt-0.5 ${aboveGoal ? "text-primary" : "text-destructive"}`}>
        {aboveGoal ? "↑" : "↓"} Goal: {goal}%
      </p>
    </div>
  );
}
