import { useMemo } from "react";

const FIRST_STAGE_THRESHOLD_HOURS = 24;
const SECOND_STAGE_THRESHOLD_HOURS = 48;

export function useLeadAlerts(leads, stages = []) {
  return useMemo(() => {
    if (!leads?.length) return [];

    const firstStageKey = stages[0]?.key;
    const secondStageKey = stages[1]?.key;
    const now = Date.now();
    const alerts = [];

    for (const lead of leads) {
      if (firstStageKey && lead.stage === firstStageKey) {
        const enteredAt = lead.inquiryDate || lead.lastContactDate;
        if (!enteredAt) continue;
        const hours = (now - new Date(enteredAt).getTime()) / (1000 * 60 * 60);
        if (hours > FIRST_STAGE_THRESHOLD_HOURS) {
          alerts.push({
            id: `inquiry-${lead.id}`,
            leadId: lead.id,
            leadName: lead.name || lead.contactPerson || "Unknown",
            type: "inquiry_aging",
            message: `${stages[0]?.label || "First stage"} overdue (${Math.round(hours)}h)`,
            hoursOverdue: Math.round(hours),
          });
        }
      }

      if (secondStageKey && lead.stage === secondStageKey) {
        const enteredAt = lead.inquiryDate || lead.lastContactDate;
        if (!enteredAt) continue;
        const hours = (now - new Date(enteredAt).getTime()) / (1000 * 60 * 60);
        if (hours > SECOND_STAGE_THRESHOLD_HOURS) {
          alerts.push({
            id: `assessment-${lead.id}`,
            leadId: lead.id,
            leadName: lead.name || lead.contactPerson || "Unknown",
            type: "assessment_aging",
            message: `${stages[1]?.label || "Second stage"} not completed (${Math.round(hours)}h)`,
            hoursOverdue: Math.round(hours),
          });
        }
      }
    }

    alerts.sort((a, b) => b.hoursOverdue - a.hoursOverdue);
    return alerts;
  }, [leads, stages]);
}
