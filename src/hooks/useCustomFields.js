import { useState, useCallback } from "react";

function slugify(str) {
  return "cf_" + str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function useCustomFields(initialFields = [], onSave) {
  const [customFields, setCustomFields] = useState(initialFields);

  const persist = useCallback((fields) => {
    setCustomFields(fields);
    onSave?.(fields);
  }, [onSave]);

  const addField = useCallback((label, type, options = []) => {
    const id = slugify(label) + "_" + Date.now().toString(36);
    const field = { id, label, type, options, createdAt: new Date().toISOString().split("T")[0] };
    const next = [...customFields, field];
    persist(next);
    return field;
  }, [customFields, persist]);

  const removeField = useCallback((id) => {
    persist(customFields.filter((f) => f.id !== id));
  }, [customFields, persist]);

  const updateField = useCallback((id, changes) => {
    persist(customFields.map((f) => f.id === id ? { ...f, ...changes } : f));
  }, [customFields, persist]);

  // Allow external sync (e.g. after fetching from Supabase)
  const setFields = useCallback((fields) => {
    setCustomFields(fields);
  }, []);

  return { customFields, addField, removeField, updateField, setFields };
}
