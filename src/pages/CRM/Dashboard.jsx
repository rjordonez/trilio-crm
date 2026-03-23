import { useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";
// import { Plus, Trash2, CheckSquare } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

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

/* COMMENTED OUT - Task widget helpers
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
*/

export default function Dashboard({ leads = [], alerts = [] /*, tasks = [], onAddTask, onUpdateTask, onDeleteTask, onNavigate, setAutoOpenLeadId */ }) {
  /* COMMENTED OUT - Task-related state
  const [taskFilter, setTaskFilter] = useState("today");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLeadId, setNewLeadId] = useState("");
  const [newDueDate, setNewDueDate] = useState(getToday());
  const [newPriority, setNewPriority] = useState("normal");
  */

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

  /* COMMENTED OUT - Task-related useMemo and handlers
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
  */

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" subtitle="At a glance overview" alerts={alerts} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* COMMENTED OUT - Today's Tasks Widget
        <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-foreground">Today's Tasks</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
            </Button>
          </div>

          <div className="flex gap-1 mb-3">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTaskFilter(tab.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  taskFilter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                } ${tab.key === "overdue" && tab.count > 0 ? (taskFilter === "overdue" ? "" : "text-destructive") : ""}`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmitTask} className="mb-3 p-3 rounded-md border border-dashed border-border bg-muted/30 space-y-2">
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newLeadId}
                  onChange={(e) => setNewLeadId(e.target.value)}
                  className="flex-1 h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">No lead (general task)</option>
                  {leads.filter((l) => l.stage !== "rejected").map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs w-24"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!newTitle.trim()}>Add</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {taskFilter === "today" ? "No tasks for today" : taskFilter === "overdue" ? "No overdue tasks" : "No tasks"}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredTasks.map((task) => {
                const lead = leadsById[task.lead_id];
                const isOverdue = task.due_date < today;
                return (
                  <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border hover:border-primary transition-colors"
                    >
                      {task.status === "done" && <span className="text-primary text-xs">✓</span>}
                    </button>
                    <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                    {lead && (
                      <button
                        onClick={() => handleLeadClick(task.lead_id)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[120px]"
                      >
                        {lead.name}
                      </button>
                    )}
                    <span className={`text-xs whitespace-nowrap ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {formatTaskDate(task.due_date)}
                    </span>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${priorityDot[task.priority] || priorityDot.normal}`} />
                    <button
                      onClick={() => onDeleteTask?.(task.id)}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Recently Completed</p>
              {doneTasks.map((task) => {
                const lead = leadsById[task.lead_id];
                return (
                  <div key={task.id} className="flex items-center gap-2 py-1 px-2 opacity-50">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary bg-primary/10 text-primary text-xs">✓</span>
                    <span className="text-sm text-foreground flex-1 truncate line-through">{task.title}</span>
                    {lead && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{lead.name}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        */}

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
    </div>
  );
}
