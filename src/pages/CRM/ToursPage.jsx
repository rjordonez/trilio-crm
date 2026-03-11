import { useState, useMemo } from "react";
import TopBar from "@/components/TopBar";
import { mockCalendarTours, salespeople } from "@/data/mockData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const hours = Array.from({ length: 10 }, (_, i) => i + 8);

const communityEventColor = "hsl(160, 60%, 45%)";

function hslToComponents(hsl) {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
}

function getEventStyle(event) {
  const isCommunity = event.type === "community";
  const color = isCommunity ? communityEventColor : event.salespersonColor;
  const { h, s, l } = hslToComponents(color);
  return {
    backgroundColor: `hsl(${h}, ${s}%, ${Math.min(l + 38, 95)}%)`,
    color: `hsl(${h}, ${s}%, ${Math.max(l - 10, 15)}%)`,
    borderLeft: `3px solid ${color}`,
  };
}

function getWeekDates(baseDate) {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDates(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? -6 : 1 - firstDay.getDay();
  const start = new Date(year, month, 1 + startDay);
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function formatHour(h) {
  return h <= 12 ? `${h}AM` : `${h - 12}PM`;
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function ToursPage() {
  const [view, setView] = useState("week");
  const [baseDate, setBaseDate] = useState(new Date(2026, 1, 11));
  const [staffFilter, setStaffFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const navigate = (dir) => {
    const d = new Date(baseDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setBaseDate(d);
  };

  const filteredTours = useMemo(() => {
    return mockCalendarTours.filter((t) => {
      if (staffFilter !== "all" && t.salesperson !== staffFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [staffFilter, typeFilter]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const monthDates = useMemo(() => getMonthDates(baseDate), [baseDate]);

  const headerLabel =
    view === "week"
      ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Calendar" subtitle="Team schedule" action={{ label: "Schedule Tour", onClick: () => {} }} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h3 className="font-display text-sm font-semibold text-foreground min-w-[200px] text-center">
          {headerLabel}
        </h3>
        <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs ml-2">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="tour">Tours</SelectItem>
            <SelectItem value="community">Community Events</SelectItem>
          </SelectContent>
        </Select>

        {/* Staff filter */}
        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Filter by staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {salespeople.map((sp) => (
              <SelectItem key={sp.name} value={sp.name}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: sp.color }} />
                  {sp.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "week" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "month" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-border bg-card">
        {salespeople.map((sp) => (
          <div
            key={sp.name}
            className={`flex items-center gap-1.5 text-xs cursor-pointer transition-opacity ${
              staffFilter !== "all" && staffFilter !== sp.name ? "opacity-30" : "text-muted-foreground"
            }`}
            onClick={() => setStaffFilter(staffFilter === sp.name ? "all" : sp.name)}
          >
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sp.color }} />
            {sp.name}
          </div>
        ))}
        <div className="border-l border-border pl-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: communityEventColor }} />
          Community Event
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {view === "week" ? (
          <WeekView dates={weekDates} tours={filteredTours} />
        ) : (
          <MonthView dates={monthDates} currentMonth={baseDate.getMonth()} tours={filteredTours} />
        )}
      </div>
    </div>
  );
}

function WeekView({ dates, tours }) {
  return (
    <div className="flex h-full">
      <div className="w-16 flex-shrink-0 border-r border-border bg-card">
        <div className="h-10 border-b border-border" />
        {hours.map((h) => (
          <div key={h} className="h-16 border-b border-border flex items-start justify-end pr-2 pt-0.5">
            <span className="text-[10px] text-muted-foreground">{formatHour(h)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-1">
        {dates.map((date) => {
          const dateStr = formatDate(date);
          const dayTours = tours.filter((t) => t.date === dateStr);
          const isToday = dateStr === formatDate(new Date(2026, 1, 13));

          return (
            <div key={dateStr} className="flex-1 min-w-[120px] border-r border-border last:border-r-0">
              <div className={`h-10 border-b border-border flex flex-col items-center justify-center ${isToday ? "bg-primary/5" : "bg-card"}`}>
                <span className="text-[10px] text-muted-foreground uppercase">{dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
                <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{date.getDate()}</span>
              </div>

              <div className="relative">
                {hours.map((h) => (
                  <div key={h} className="h-16 border-b border-border/50" />
                ))}

                {dayTours.map((tour) => {
                  const top = (tour.startHour - 8) * 64;
                  const style = getEventStyle(tour);
                  return (
                    <div
                      key={tour.id}
                      className="absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        top: `${top}px`,
                        height: "60px",
                        ...style,
                      }}
                    >
                      <p className="text-[10px] font-semibold truncate">{tour.leadName}</p>
                      <p className="text-[9px] opacity-70 truncate">{tour.facility}</p>
                      <p className="text-[9px] opacity-70">{formatHour(tour.startHour)} – {formatHour(tour.startHour + 1)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ dates, currentMonth, tours }) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-medium uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-t border-border">
        {dates.map((date) => {
          const dateStr = formatDate(date);
          const dayTours = tours.filter((t) => t.date === dateStr);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = dateStr === "2026-02-13";

          return (
            <div
              key={dateStr}
              className={`border-r border-b border-border min-h-[100px] p-1 ${
                isCurrentMonth ? "bg-card" : "bg-muted/30"
              }`}
            >
              <span className={`text-xs font-medium block mb-1 ${
                isToday ? "text-primary font-bold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
              }`}>
                {date.getDate()}
              </span>
              <div className="space-y-0.5">
                {dayTours.map((tour) => {
                  const style = getEventStyle(tour);
                  return (
                    <div
                      key={tour.id}
                      className="rounded px-1 py-0.5 text-[9px] truncate cursor-pointer hover:opacity-80"
                      style={style}
                      title={`${tour.leadName} – ${tour.facility} (${tour.type === "community" ? "Community Event" : tour.salesperson})`}
                    >
                      {formatHour(tour.startHour)} {tour.leadName}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
