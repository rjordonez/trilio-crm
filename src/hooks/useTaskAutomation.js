import { useMemo, useCallback } from "react";

const DEFAULT_RULES = [
  {
    id: "default_follow_up",
    trigger: "new_lead",
    enabled: true,
    taskTitle: "Follow up with {{name}}",
    dueDaysOffset: 1,
    priority: "normal",
  },
  {
    id: "default_pre_tour",
    trigger: "pre_tour",
    enabled: true,
    taskTitle: "Schedule tour for {{name}}",
    dueDaysOffset: 2,
    priority: "normal",
  },
  {
    id: "default_post_tour",
    trigger: "post_tour",
    enabled: true,
    taskTitle: "Send follow-up after tour for {{name}}",
    dueDaysOffset: 1,
    priority: "high",
  },
  {
    id: "default_deposit",
    trigger: "deposit",
    enabled: true,
    taskTitle: "Confirm deposit received for {{name}}",
    dueDaysOffset: 0,
    priority: "high",
  },
];

function generateRuleId() {
  return "rule_" + Math.random().toString(36).slice(2, 9);
}

function interpolateTemplate(template, lead, stageLabelText) {
  return template
    .replace(/\{\{name\}\}/g, lead?.name || "Unknown")
    .replace(/\{\{stage\}\}/g, stageLabelText || "")
    .replace(/\{\{source\}\}/g, lead?.source || "");
}

function getDueDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + (daysOffset || 0));
  return d.toISOString().split("T")[0];
}

export function useTaskAutomation(orgSettings, saveOrgSettings, stages) {
  const rules = useMemo(() => {
    const saved = orgSettings?.task_automation?.rules;
    if (saved && saved.length > 0) return saved;
    return DEFAULT_RULES;
  }, [orgSettings?.task_automation?.rules]);

  const stageLabel = useMemo(() => {
    const map = {};
    (stages || []).forEach((s) => { map[s.key] = s.label; });
    return map;
  }, [stages]);

  const addRule = useCallback((rule) => {
    const newRule = { ...rule, id: generateRuleId() };
    const newRules = [...rules, newRule];
    saveOrgSettings?.({ task_automation: { rules: newRules } });
  }, [rules, saveOrgSettings]);

  const removeRule = useCallback((id) => {
    const newRules = rules.filter((r) => r.id !== id);
    saveOrgSettings?.({ task_automation: { rules: newRules } });
  }, [rules, saveOrgSettings]);

  const updateRule = useCallback((id, updates) => {
    const newRules = rules.map((r) => r.id === id ? { ...r, ...updates } : r);
    saveOrgSettings?.({ task_automation: { rules: newRules } });
  }, [rules, saveOrgSettings]);

  const toggleRule = useCallback((id) => {
    const newRules = rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveOrgSettings?.({ task_automation: { rules: newRules } });
  }, [rules, saveOrgSettings]);

  const resetToDefaults = useCallback(() => {
    saveOrgSettings?.({ task_automation: { rules: DEFAULT_RULES } });
  }, [saveOrgSettings]);

  const executeRules = useCallback((trigger, lead, stageLabelOverride) => {
    const matching = rules.filter((r) => r.enabled && r.trigger === trigger);
    if (matching.length === 0) return [];

    const labelText = stageLabelOverride || stageLabel[trigger] || trigger;

    return matching.map((rule) => ({
      leadId: lead?.id || null,
      title: interpolateTemplate(rule.taskTitle, lead, labelText),
      dueDate: getDueDate(rule.dueDaysOffset),
      priority: rule.priority || "normal",
    }));
  }, [rules, stageLabel]);

  return {
    rules,
    addRule,
    removeRule,
    updateRule,
    toggleRule,
    resetToDefaults,
    executeRules,
    DEFAULT_RULES,
  };
}
