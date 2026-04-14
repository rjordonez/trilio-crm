import { useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { Users, Plus, Trash2, CheckSquare, Calendar, Home, TrendingUp, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const neutralPalette = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
  "hsl(228, 60%, 75%)",
  "hsl(210, 15%, 75%)",
  "hsl(160, 60%, 45%)",
  "hsl(38, 92%, 55%)",
];

// stageLabel and funnelOrder are now derived from the stages prop

const priorityDot = { high: "bg-destructive", normal: "bg-warning", low: "bg-muted-foreground/40" };

function formatTaskDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getEndOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

export default function Dashboard({ leads = [], alerts = [], stages = [], tasks = [], onAddTask, onUpdateTask, onDeleteTask, onNavigate, setAutoOpenLeadId }) {
  const funnelOrder = useMemo(() => stages.map((s) => s.key), [stages]);
  const stageLabel = useMemo(() => {
    const map = {};
    stages.forEach((s) => { map[s.key] = s.label; });
    return map;
  }, [stages]);
  const [dateRange, setDateRange] = useState("this_month");
  const [taskFilter, setTaskFilter] = useState("today");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLeadId, setNewLeadId] = useState("");
  const [newDueDate, setNewDueDate] = useState(getToday());
  const [newPriority, setNewPriority] = useState("normal");

  const dateFilteredLeads = useMemo(() => {
    const now = new Date();
    let start;
    switch (dateRange) {
      case "this_week": {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        start = d.toISOString().split("T")[0];
        break;
      }
      case "this_month":
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        break;
      case "this_quarter": {
        const q = Math.floor(now.getMonth() / 3) * 3;
        start = `${now.getFullYear()}-${String(q + 1).padStart(2, "0")}-01`;
        break;
      }
      case "this_year":
        start = `${now.getFullYear()}-01-01`;
        break;
      default:
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }
    return leads.filter((l) => (l.inquiryDate || l.initialContact || "") >= start);
  }, [leads, dateRange]);

  const activeLeads = useMemo(
    () => leads.filter((l) => l.stage && l.stage !== "rejected" && l.stage !== "closed"),
    [leads]
  );

  // Conversion metrics
  const conversionMetrics = useMemo(() => {
    const total = dateFilteredLeads.length || 1;
    const tourStages = new Set(["assessment_scheduled", "assessment_completed", "proposal_sent", "pending_decision", "closed"]);
    const moveInStages = new Set(["closed"]);
    const tours = dateFilteredLeads.filter((l) => tourStages.has(l.stage)).length;
    const moveIns = dateFilteredLeads.filter((l) => moveInStages.has(l.stage)).length;
    return {
      inquiryToTour: Math.round((tours / total) * 100),
      inquiryToMI: Math.round((moveIns / total) * 100),
      tourToMI: tours > 0 ? Math.round((moveIns / tours) * 100) : 0,
    };
  }, [dateFilteredLeads]);

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

  // Lead sources by month
  const sourcesByMonth = useMemo(() => {
    const months = {};
    leads.forEach((l) => {
      const date = l.inquiryDate || l.initialContact;
      if (!date) return;
      const monthKey = date.slice(0, 7); // "YYYY-MM"
      const src = l.source || l.intakeNote?.leadSource || "Other";
      if (!months[monthKey]) months[monthKey] = {};
      months[monthKey][src] = (months[monthKey][src] || 0) + 1;
    });
    const allSources = [...new Set(leads.map((l) => l.source || l.intakeNote?.leadSource || "Other"))];
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, counts]) => {
        const d = new Date(month + "-01");
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const entry = { month: label };
        allSources.forEach((s) => { entry[s] = counts[s] || 0; });
        return entry;
      });
  }, [leads]);

  const allSourceNames = useMemo(() => [...new Set(leads.map((l) => l.source || l.intakeNote?.leadSource || "Other"))], [leads]);

  // Successful leads (move-ins) over time
  const moveInsByMonth = useMemo(() => {
    const months = {};
    const moveInStages = new Set(["closed", "move_in"]);
    leads.forEach((l) => {
      const date = l.inquiryDate || l.initialContact;
      if (!date) return;
      const monthKey = date.slice(0, 7);
      if (!months[monthKey]) months[monthKey] = { total: 0, moveIns: 0 };
      months[monthKey].total += 1;
      if (moveInStages.has(l.stage)) months[monthKey].moveIns += 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => {
        const d = new Date(month + "-01");
        return {
          month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          "Total Leads": data.total,
          "Move-ins": data.moveIns,
        };
      });
  }, [leads]);

  const today = getToday();
  const endOfWeek = getEndOfWeek();

  const leadsById = useMemo(() => {
    const map = {};
    leads.forEach((l) => { map[l.id] = l; });
    return map;
  }, [leads]);

  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === "pending"), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done").slice(0, 5), [tasks]);

  const overdueTasks = useMemo(() => pendingTasks.filter((t) => t.due_date < today), [pendingTasks, today]);
  const todayTasks = useMemo(() => pendingTasks.filter((t) => t.due_date === today), [pendingTasks, today]);
  const weekTasks = useMemo(() => pendingTasks.filter((t) => t.due_date >= today && t.due_date <= endOfWeek), [pendingTasks, today, endOfWeek]);

  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case "overdue": return overdueTasks;
      case "today": return todayTasks;
      case "week": return weekTasks;
      case "all": return pendingTasks;
      default: return todayTasks;
    }
  }, [taskFilter, overdueTasks, todayTasks, weekTasks, pendingTasks]);

  const handleToggleTask = async (task) => {
    await onUpdateTask?.(task.id, { status: task.status === "pending" ? "done" : "pending" });
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddTask?.({ leadId: newLeadId || null, title: newTitle.trim(), dueDate: newDueDate, priority: newPriority });
    setNewTitle("");
    setNewLeadId("");
    setNewDueDate(getToday());
    setNewPriority("normal");
    setShowAddForm(false);
  };

  const handleLeadClick = (leadId) => {
    setAutoOpenLeadId?.(leadId);
    onNavigate?.("leads");
  };

  const filterTabs = [
    { key: "overdue", label: "Overdue", count: overdueTasks.length },
    { key: "today", label: "Today", count: todayTasks.length },
    { key: "week", label: "This Week", count: weekTasks.length },
    { key: "all", label: "All", count: pendingTasks.length },
  ];

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" subtitle="At a glance overview" alerts={alerts} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Date Filter */}
        <div className="flex justify-end">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-3 text-xs"
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Active Leads</span>
              <Users className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="font-display font-bold text-foreground text-2xl">{activeLeads.length}</p>
            <span className="text-xs text-muted-foreground">{leads.length} total</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Tours This Week</span>
              <CalendarDays className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="font-display font-bold text-foreground text-2xl">0</p>
            <span className="text-xs text-muted-foreground">0 vs last week</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Occupancy Rate</span>
              <Home className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="font-display font-bold text-foreground text-2xl">0%</p>
            <span className="text-xs text-muted-foreground">0% vs last month</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Move-ins (MTD)</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="font-display font-bold text-foreground text-2xl">0</p>
            <span className="text-xs text-muted-foreground">0 vs last month</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Sources */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Lead Sources</h3>
            <p className="text-xs text-muted-foreground mb-4">{totalLeads} total leads this month</p>
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

          {/* Right column: Conversion Metrics + Sales Funnel */}
          <div className="space-y-6">
            {/* Conversion Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Inquiry → Tour</p>
                <p className="font-display font-bold text-lg text-foreground">{conversionMetrics.inquiryToTour}%</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Inquiry → MI</p>
                <p className="font-display font-bold text-lg text-foreground">{conversionMetrics.inquiryToMI}%</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-crm-sm text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Tour → MI</p>
                <p className="font-display font-bold text-lg text-foreground">{conversionMetrics.tourToMI}%</p>
              </div>
            </div>

            {/* Sales Funnel */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
              <h3 className="font-display text-sm font-semibold text-foreground mb-1">Sales Funnel</h3>
              <p className="text-xs text-muted-foreground mb-4">New inquiries month-to-date</p>
              {leads.length > 0 ? (
                <div className="flex flex-col items-center gap-1.5 px-4">
                  {funnel.map((stage, i) => {
                    const maxCount = Math.max(...funnel.map((s) => s.count), 1);
                    const minWidth = 40;
                    const pct = stage.count > 0 ? minWidth + ((100 - minWidth) * stage.count) / maxCount : minWidth;
                    return (
                      <div
                        key={stage.stage}
                        className="flex items-center justify-center text-[11px] font-medium text-primary-foreground rounded-md transition-all py-2.5 px-3"
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

        {/* New Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Sources by Month */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Lead Sources by Month</h3>
            <p className="text-xs text-muted-foreground mb-4">Last 6 months breakdown</p>
            {sourcesByMonth.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourcesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    {allSourceNames.map((name, i) => (
                      <Bar key={name} dataKey={name} stackId="sources" fill={neutralPalette[i % neutralPalette.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </div>

          {/* Successful Leads Over Time */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-crm-sm">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Leads & Move-ins</h3>
            <p className="text-xs text-muted-foreground mb-4">Tracking successful conversions over time</p>
            {moveInsByMonth.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moveInsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="Total Leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Move-ins" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
