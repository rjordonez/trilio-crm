import { useMemo, useCallback } from "react";

const DEFAULT_STAGES = [
  { key: "inquiry", label: "Inquiry" },
  { key: "assessment_scheduled", label: "Assessment Scheduled" },
  { key: "assessment_completed", label: "Assessment Completed" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "pending_decision", label: "Pending Decision" },
  { key: "closed", label: "Closed" },
];

function generateKey(label) {
  return "custom_" + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_" + Math.random().toString(36).slice(2, 9);
}

function buildStageLabel(stages) {
  const map = {};
  stages.forEach((s) => { map[s.key] = s.label; });
  map.rejected = "Rejected";
  return map;
}

function buildStageProgress(stages) {
  const map = {};
  const count = stages.length;
  stages.forEach((s, i) => {
    map[s.key] = count === 1 ? 100 : Math.round(10 + (90 * i) / (count - 1));
  });
  map.rejected = 0;
  return map;
}

export function usePipelineStages(orgSettings, saveOrgSettings, updateLead) {
  const stages = useMemo(() => {
    const saved = orgSettings?.pipeline_stages;
    if (saved && saved.length > 0) return saved;
    return DEFAULT_STAGES;
  }, [orgSettings?.pipeline_stages]);

  const stageLabel = useMemo(() => buildStageLabel(stages), [stages]);
  const stageProgress = useMemo(() => buildStageProgress(stages), [stages]);

  const addStage = useCallback((label) => {
    const key = generateKey(label);
    const newStages = [...stages, { key, label }];
    saveOrgSettings?.({ pipeline_stages: newStages });
    return key;
  }, [stages, saveOrgSettings]);

  const removeStage = useCallback(async (key, moveToKey, leads) => {
    // Move leads in the deleted stage to moveToKey
    const leadsToMove = leads?.filter((l) => l.stage === key) || [];
    for (const lead of leadsToMove) {
      await updateLead?.(lead.id, { stage: moveToKey });
    }
    const newStages = stages.filter((s) => s.key !== key);
    saveOrgSettings?.({ pipeline_stages: newStages });
    return leadsToMove.length;
  }, [stages, saveOrgSettings, updateLead]);

  const renameStage = useCallback((key, newLabel) => {
    const newStages = stages.map((s) => s.key === key ? { ...s, label: newLabel } : s);
    saveOrgSettings?.({ pipeline_stages: newStages });
  }, [stages, saveOrgSettings]);

  const reorderStages = useCallback((newOrder) => {
    saveOrgSettings?.({ pipeline_stages: newOrder });
  }, [saveOrgSettings]);

  const resetToDefault = useCallback(() => {
    saveOrgSettings?.({ pipeline_stages: DEFAULT_STAGES });
  }, [saveOrgSettings]);

  return { stages, stageLabel, stageProgress, addStage, removeStage, renameStage, reorderStages, resetToDefault, DEFAULT_STAGES };
}
