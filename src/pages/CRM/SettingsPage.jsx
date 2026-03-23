import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, UserX, UserCheck, XCircle, LogOut, Crown, Shield, User, Mail, Pencil, Save } from "lucide-react";
// import { Plus, Trash2, RotateCcw, Columns3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
// import { useColumnConfig } from "@/hooks/useColumnConfig";
import { defaultTemplates } from "@/data/emailTemplates";

export default function SettingsPage({ alerts = [], customFields = [], onAddField, onRemoveField, onUpdateField, orgSettings, saveOrgSettings }) {
  const { organization, leaveOrganization, refreshOrganization } = useAuth();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [copied, setCopied] = useState(false);

  const isAdmin = organization?.role === 'admin' || organization?.role === 'owner';
  const isOwner = organization?.role === 'owner';

  /* COMMENTED OUT - useColumnConfig hook
  const { allColumns, visibleIds, toggleColumn, resetToDefaults } = useColumnConfig(
    orgSettings?.column_config || null,
    customFields,
    (ids) => saveOrgSettings?.({ column_config: ids })
  );
  */
  /* COMMENTED OUT - Custom field form state
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  */

  const fetchMembers = useCallback(async () => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from('organization_members')
      .select('id, user_id, role, status, joined_at, user_profiles(email, full_name)')
      .eq('organization_id', organization.id)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch members:', error);
      return;
    }

    setMembers(data || []);
    setLoadingMembers(false);
  }, [organization?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(organization.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async (memberId) => {
    const { error } = await supabase.rpc('approve_member', { p_member_id: memberId });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Member approved" });
    fetchMembers();
  };

  const handleDeny = async (memberId) => {
    const { error } = await supabase.rpc('deny_member', { p_member_id: memberId });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request denied" });
    fetchMembers();
  };

  const handleRemove = async (memberId) => {
    const { error } = await supabase.rpc('remove_member', { p_member_id: memberId });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Member removed" });
    fetchMembers();
  };

  const handleLeave = async () => {
    // Check if sole owner
    if (isOwner) {
      const otherOwners = members.filter(m => m.role === 'owner' && m.status === 'active' && m.id !== members.find(me => me.role === 'owner')?.id);
      if (otherOwners.length === 0 && members.filter(m => m.role === 'owner' && m.status === 'active').length <= 1) {
        toast({
          title: "Cannot leave",
          description: "You are the only owner. Transfer ownership to another member first.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await leaveOrganization();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Rejection email template (persisted in localStorage per org)
  const storageKey = organization?.id ? `rejection_template_${organization.id}` : null;
  const defaultRejection = defaultTemplates.find((t) => t.id === "t6");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved) {
        setTemplateSubject(saved.subject);
        setTemplateBody(saved.body);
      } else {
        setTemplateSubject(defaultRejection?.subject || "");
        setTemplateBody(defaultRejection?.body || "");
      }
    } catch {
      setTemplateSubject(defaultRejection?.subject || "");
      setTemplateBody(defaultRejection?.body || "");
    }
  }, [storageKey]);

  const handleSaveTemplate = () => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ subject: templateSubject, body: templateBody }));
    setEditingTemplate(false);
    toast({ title: "Template saved", description: "Rejection email template updated" });
  };

  const handleResetTemplate = () => {
    if (!storageKey) return;
    localStorage.removeItem(storageKey);
    setTemplateSubject(defaultRejection?.subject || "");
    setTemplateBody(defaultRejection?.body || "");
    setEditingTemplate(false);
    toast({ title: "Template reset", description: "Restored to default" });
  };

  /* COMMENTED OUT - handleAddField function
  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const options = newFieldType === "select" ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) : [];
    onAddField?.(newFieldLabel.trim(), newFieldType, options);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldOptions("");
    toast({ title: "Field added", description: `"${newFieldLabel.trim()}" field created` });
  };
  */

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const roleIcon = (role) => {
    if (role === 'owner') return <Crown className="h-3.5 w-3.5 text-amber-500" />;
    if (role === 'admin') return <Shield className="h-3.5 w-3.5 text-blue-500" />;
    return <User className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const roleColors = {
    owner: "bg-amber-500/10 text-amber-600",
    admin: "bg-blue-500/10 text-blue-600",
    member: "bg-muted text-muted-foreground",
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Settings" subtitle="Organization & account" alerts={alerts} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">

          {/* Organization Info */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Organization</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-medium text-foreground">{organization?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{organization?.code}</code>
                  <button
                    onClick={handleCopyCode}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Members (admin/owner only) */}
          {isAdmin && pendingMembers.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 shadow-crm-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Pending Requests
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">{pendingMembers.length}</Badge>
              </h3>
              <div className="space-y-2">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.user_profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.user_profiles?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleApprove(m.id)}>
                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeny(m.id)} className="text-destructive hover:text-destructive">
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Members <span className="text-muted-foreground font-normal">({activeMembers.length})</span>
            </h3>
            {loadingMembers ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {roleIcon(m.role)}
                            {m.user_profiles?.full_name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {m.user_profiles?.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={roleColors[m.role]}>
                            {m.role}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {m.role !== 'owner' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <UserX className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {m.user_profiles?.full_name || m.user_profiles?.email} will be removed from the organization. Their data will remain.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemove(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Rejection Email Template */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Rejection Email Template</h3>
              </div>
              {!editingTemplate ? (
                <Button variant="outline" size="sm" onClick={() => setEditingTemplate(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveTemplate}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(false)}>Cancel</Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This email is sent when you reject a lead. Available tags: <code className="bg-muted px-1 rounded">{"{{name}}"}</code> <code className="bg-muted px-1 rounded">{"{{contact_person}}"}</code> <code className="bg-muted px-1 rounded">{"{{care_level}}"}</code> <code className="bg-muted px-1 rounded">{"{{sender_name}}"}</code>
            </p>
            {editingTemplate ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                  <Input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Body</label>
                  <Textarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} className="min-h-[250px] text-sm font-mono" />
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleResetTemplate}>
                  Reset to default
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">Subject: {templateSubject}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{templateBody}</p>
              </div>
            )}
          </div>

          {/* COMMENTED OUT - Custom Fields section
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Custom Fields</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Add custom fields to track additional lead data. Values are stored per lead.
            </p>

            {customFields.length > 0 && (
              <div className="space-y-1">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/30">
                    <span className="text-sm text-foreground flex-1">{field.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{field.type}</Badge>
                    {field.type === "select" && field.options?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{field.options.length} options</span>
                    )}
                    <button onClick={() => { onRemoveField?.(field.id); toast({ title: "Field removed" }); }} className="p-0.5 rounded hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Field name..." value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} className="flex-1 h-8 text-xs" />
                <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs w-28">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              {newFieldType === "select" && (
                <Input placeholder="Options (comma separated)..." value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} className="h-8 text-xs" />
              )}
              <Button size="sm" onClick={handleAddField} disabled={!newFieldLabel.trim()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
              </Button>
            </div>
          </div>
          */}

          {/* COMMENTED OUT - Table Columns section
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Table Columns</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { resetToDefaults(); toast({ title: "Columns reset" }); }}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Choose which columns appear in the leads table.</p>
            <div className="space-y-0.5">
              {allColumns.map((col) => (
                <label key={col.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleIds.includes(col.id)}
                    disabled={col.alwaysVisible}
                    onChange={() => toggleColumn(col.id)}
                    className="rounded border-border"
                  />
                  <span className={`text-sm ${col.alwaysVisible ? "text-muted-foreground" : "text-foreground"}`}>{col.label}</span>
                  {col.isCustom && <span className="text-[10px] text-muted-foreground">(custom)</span>}
                  {col.alwaysVisible && <span className="text-[10px] text-muted-foreground">(always visible)</span>}
                </label>
              ))}
            </div>
          </div>
          */}

          {/* Leave Organization */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm">
            <h3 className="text-sm font-semibold text-foreground mb-2">Leave Organization</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Your data will remain in the organization after you leave.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Leave {organization?.name}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave organization?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose access to all organization data. You can rejoin later with admin approval.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </div>
      </div>
    </div>
  );
}
