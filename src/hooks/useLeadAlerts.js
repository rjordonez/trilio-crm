import { useMemo } from "react";

const INQUIRY_THRESHOLD_HOURS = 24;
const ASSESSMENT_THRESHOLD_HOURS = 48;

export function useLeadAlerts(leads) {
  return useMemo(() => {
    if (!leads?.length) return [];

    const now = Date.now();
    const alerts = [];

    for (const lead of leads) {
      if (lead.stage === "inquiry") {
        const enteredAt = lead.inquiryDate || lead.lastContactDate;
        if (!enteredAt) continue;
        const hours = (now - new Date(enteredAt).getTime()) / (1000 * 60 * 60);
        if (hours > INQUIRY_THRESHOLD_HOURS) {
          alerts.push({
            id: `inquiry-${lead.id}`,
            leadId: lead.id,
            leadName: lead.name || lead.contactPerson || "Unknown",
            type: "inquiry_aging",
            message: `Inquiry overdue (${Math.round(hours)}h)`,
            hoursOverdue: Math.round(hours),
          });
        }
      }

      if (lead.stage === "assessment_scheduled") {
        const enteredAt = lead.inquiryDate || lead.lastContactDate;
        if (!enteredAt) continue;
        const hours = (now - new Date(enteredAt).getTime()) / (1000 * 60 * 60);
        if (hours > ASSESSMENT_THRESHOLD_HOURS) {
          alerts.push({
            id: `assessment-${lead.id}`,
            leadId: lead.id,
            leadName: lead.name || lead.contactPerson || "Unknown",
            type: "assessment_aging",
            message: `Assessment not completed (${Math.round(hours)}h)`,
            hoursOverdue: Math.round(hours),
          });
        }
      }
    }

    alerts.sort((a, b) => b.hoursOverdue - a.hoursOverdue);
    return alerts;
  }, [leads]);
}
