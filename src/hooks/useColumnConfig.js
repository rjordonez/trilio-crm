import { useState, useCallback, useMemo } from "react";

const scoreOptions = ["cold", "hot", "nurture", "warm"];
const sourceOptions = ["Website", "Digital Ads", "Referral Partner", "Event", "Other"];
const careOptions = ["ADL Support", "Assisted Living", "Post-Acute", "Companionship", "Not Sure Yet"];
const stageFilterOptions = ["inquiry", "assessment_scheduled", "assessment_completed", "proposal_sent", "pending_decision", "closed", "rejected"];

export const BUILT_IN_COLUMNS = [
  { id: "name", label: "Prospect Name", minWidth: 150, sticky: true, alwaysVisible: true, renderType: "name" },
  { id: "score", label: "Score", minWidth: 90, filterable: true, filterKey: "score", filterOptions: scoreOptions, renderType: "scoreBadge" },
  { id: "stage", label: "Stage", minWidth: 170, filterable: true, filterKey: "stage", filterOptions: stageFilterOptions, renderType: "stageProgress" },
  { id: "source", label: "Source", minWidth: 110, filterable: true, filterKey: "source", filterOptions: sourceOptions, renderType: "text", dataKey: "source" },
  { id: "careLevel", label: "Care Type", minWidth: 130, filterable: true, filterKey: "careLevel", filterOptions: careOptions, renderType: "careBadge" },
  { id: "salesRep", label: "Assign To", minWidth: 110, filterable: true, filterKey: "salesRep", renderType: "text", dataKey: "salesRep", dynamicOptions: true },
  { id: "contact", label: "Contact", minWidth: 120, renderType: "contact" },
  { id: "inquiryDate", label: "Inquiry Date", minWidth: 95, renderType: "date", dataKey: "inquiryDate" },
  { id: "lastContacted", label: "Last Contacted", minWidth: 95, renderType: "relativeDate", dataKey: "lastContactDate" },
  { id: "nextActivity", label: "Next Activity", minWidth: 180, renderType: "text", dataKey: "nextActivity" },
];

const DEFAULT_VISIBLE = BUILT_IN_COLUMNS.map((c) => c.id);

const typeToRender = { text: "customText", number: "customNumber", date: "customDate", select: "customSelect" };

export function useColumnConfig(initialVisibleIds, customFields = [], onSave) {
  const [visibleIds, setVisibleIds] = useState(initialVisibleIds);

  const allColumns = useMemo(() => {
    const custom = customFields.map((f) => ({
      id: f.id,
      label: f.label,
      minWidth: 120,
      renderType: typeToRender[f.type] || "customText",
      dataKey: f.id,
      isCustom: true,
      filterOptions: f.type === "select" ? f.options : undefined,
      filterable: f.type === "select",
      filterKey: f.id,
    }));
    return [...BUILT_IN_COLUMNS, ...custom];
  }, [customFields]);

  const effectiveVisible = useMemo(() => {
    if (!visibleIds) return [...DEFAULT_VISIBLE, ...customFields.map((f) => f.id)];
    const known = new Set(visibleIds);
    const newCustom = customFields.filter((f) => !known.has(f.id)).map((f) => f.id);
    return [...visibleIds, ...newCustom];
  }, [visibleIds, customFields]);

  const visibleColumns = useMemo(() => {
    const validIds = new Set(allColumns.map((c) => c.id));
    const ordered = effectiveVisible.filter((id) => validIds.has(id));
    return ordered.map((id) => allColumns.find((c) => c.id === id)).filter(Boolean);
  }, [allColumns, effectiveVisible]);

  const persist = useCallback((ids) => {
    setVisibleIds(ids);
    onSave?.(ids);
  }, [onSave]);

  const toggleColumn = useCallback((id) => {
    const col = allColumns.find((c) => c.id === id);
    if (col?.alwaysVisible) return;
    const current = effectiveVisible;
    if (current.includes(id)) {
      persist(current.filter((v) => v !== id));
    } else {
      persist([...current, id]);
    }
  }, [allColumns, effectiveVisible, persist]);

  const setColumnOrder = useCallback((ids) => {
    persist(ids);
  }, [persist]);

  const resetToDefaults = useCallback(() => {
    setVisibleIds(null);
    onSave?.(null);
  }, [onSave]);

  // Allow external sync
  const setConfig = useCallback((ids) => {
    setVisibleIds(ids);
  }, []);

  return { allColumns, visibleColumns, visibleIds: effectiveVisible, toggleColumn, setColumnOrder, resetToDefaults, setConfig };
}
