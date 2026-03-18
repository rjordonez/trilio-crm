import { useState, useMemo } from "react";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Plus,
  Send,
  Sparkles,
  Eye,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  Pencil,
  Trash2,
  Copy,
  Loader2,
} from "lucide-react";
import { mockPipelineLeads } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { defaultTemplates as sharedTemplates, personalizeContent } from "@/data/emailTemplates";

const defaultCampaigns = [
  { id: "c1", name: "February Inquiry Welcome Blast", templateId: "t1", recipients: ["p1", "p2", "p3", "p4", "p17"], status: "sent", sentAt: "2026-02-10", openRate: 72, clickRate: 34 },
  { id: "c2", name: "Post-Tour Follow-Up Batch", templateId: "t2", recipients: ["p11", "p12", "p13"], status: "sent", sentAt: "2026-02-09", openRate: 85, clickRate: 45 },
  { id: "c3", name: "Weekly Check-In", templateId: "t3", recipients: ["p5", "p6", "p7", "p8", "p9"], status: "scheduled", scheduledAt: "2026-02-15" },
  { id: "c4", name: "February Monthly Newsletter", templateId: "t4", recipients: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12", "p13"], status: "sent", sentAt: "2026-02-12", openRate: 68, clickRate: 22 },
  { id: "c5", name: "Spring Open House Invitation", templateId: "t5", recipients: ["p1", "p2", "p3", "p5", "p6", "p14", "p15", "p16", "p17"], status: "scheduled", scheduledAt: "2026-02-18" },
];

export default function FollowUpPage({ alerts = [] }) {
  const [templates, setTemplates] = useState(sharedTemplates);
  const [campaigns, setCampaigns] = useState(defaultCampaigns);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [personalizing, setPersonalizing] = useState(false);

  // Campaign creation state
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [filterStage, setFilterStage] = useState("all");

  const leads = mockPipelineLeads;

  const filteredLeads = useMemo(() => {
    if (filterStage === "all") return leads;
    return leads.filter((l) => l.stage === filterStage);
  }, [leads, filterStage]);

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    setTemplates((prev) => {
      const exists = prev.find((t) => t.id === editingTemplate.id);
      if (exists) return prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t));
      return [...prev, editingTemplate];
    });
    setEditOpen(false);
    toast({ title: "Template saved" });
  };

  const handleNewTemplate = () => {
    setEditingTemplate({
      id: `t${Date.now()}`,
      name: "",
      subject: "",
      body: "",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setEditOpen(true);
  };

  const handleDeleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Template deleted" });
  };

  const handleDuplicateTemplate = (t) => {
    const dup = { ...t, id: `t${Date.now()}`, name: `${t.name} (Copy)` };
    setTemplates((prev) => [...prev, dup]);
    toast({ title: "Template duplicated" });
  };

  const toggleRecipient = (id) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const ids = filteredLeads.map((l) => l.id);
    const allSelected = ids.every((id) => selectedRecipients.includes(id));
    if (allSelected) {
      setSelectedRecipients((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedRecipients((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleCreateCampaign = () => {
    if (!campaignName || !selectedTemplateId || selectedRecipients.length === 0) return;
    const campaign = {
      id: `c${Date.now()}`,
      name: campaignName,
      templateId: selectedTemplateId,
      recipients: selectedRecipients,
      status: "draft",
    };
    setCampaigns((prev) => [...prev, campaign]);
    setCampaignOpen(false);
    setCampaignName("");
    setSelectedTemplateId("");
    setSelectedRecipients([]);
    toast({ title: "Campaign created as draft" });
  };

  const handleSendCampaign = (id) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "sent", sentAt: new Date().toISOString().slice(0, 10), openRate: Math.floor(Math.random() * 30) + 60, clickRate: Math.floor(Math.random() * 20) + 25 }
          : c
      )
    );
    toast({ title: "Campaign sent!", description: "Emails are being delivered." });
  };

  const handlePersonalizePreview = (templateId, leadId) => {
    setPersonalizing(true);
    setPreviewOpen(true);
    const template = templates.find((t) => t.id === templateId);
    const lead = leads.find((l) => l.id === leadId);
    setTimeout(() => {
      if (template && lead) {
        setPreviewContent(personalizeContent(template.body, lead));
      }
      setPersonalizing(false);
    }, 800);
  };

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-warning/10 text-warning",
    sent: "bg-success/10 text-success",
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Follow-Up"
        subtitle="Email automation & campaigns"
        action={{ label: "New Campaign", onClick: () => setCampaignOpen(true) }}
        alerts={alerts}
      />

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Templates
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-4">
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const tpl = templates.find((t) => t.id === c.templateId);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{tpl?.name || "—"}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.recipients.length}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[c.status]}>
                            {c.status === "draft" && <Clock className="h-3 w-3 mr-1" />}
                            {c.status === "scheduled" && <Clock className="h-3 w-3 mr-1" />}
                            {c.status === "sent" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{c.openRate ? `${c.openRate}%` : "—"}</TableCell>
                        <TableCell className="text-sm">{c.clickRate ? `${c.clickRate}%` : "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.recipients.length > 0 && tpl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => handlePersonalizePreview(c.templateId, c.recipients[0])}
                              >
                                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" /> Preview
                              </Button>
                            )}
                            {c.status === "draft" && (
                              <Button size="sm" className="text-xs" onClick={() => handleSendCampaign(c.id)}>
                                <Send className="h-3.5 w-3.5 mr-1" /> Send
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{templates.length} templates</p>
              <Button size="sm" onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-1.5" /> New Template
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-card p-4 space-y-2 shadow-crm-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground truncate">{t.name}</h4>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTemplate(t); setEditOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicateTemplate(t)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTemplate(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">Subject: {t.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{t.body.slice(0, 150)}…</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground/60">{t.createdAt}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        const lead = leads[0];
                        handlePersonalizePreview(t.id, lead.id);
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-primary" /> Personalize
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.name ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-3">
              <Input
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                placeholder="Template name"
              />
              <Input
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                placeholder="Email subject — use {{name}}, {{contact_person}} for merge tags"
              />
              <Textarea
                value={editingTemplate.body}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                placeholder="Email body — merge tags: {{name}}, {{contact_person}}, {{facility}}, {{sales_rep}}, {{care_level}}, {{personalized_note}}"
                className="min-h-[250px] font-mono text-xs"
              />
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">
                  <strong>Merge tags:</strong> {"{{name}}"}, {"{{contact_person}}"}, {"{{facility}}"}, {"{{sales_rep}}"}, {"{{care_level}}"}, {"{{personalized_note}}"}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} disabled={!editingTemplate.name || !editingTemplate.subject}>Save Template</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Email Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Campaign name"
            />

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Select Template</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`text-left rounded-lg border p-3 text-sm transition-colors ${
                      selectedTemplateId === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.subject}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Select Recipients</label>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground"
                  >
                    <option value="all">All stages</option>
                    <option value="inquiry">Inquiry</option>
                    <option value="connection">Connection</option>
                    <option value="pre_tour">Pre-Tour</option>
                    <option value="post_tour">Post-Tour</option>
                    <option value="deposit">Deposit</option>
                    <option value="move_in">Move-in</option>
                  </select>
                  <Button variant="outline" size="sm" className="text-xs" onClick={selectAll}>
                    {filteredLeads.every((l) => selectedRecipients.includes(l.id)) ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>
              <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto">
                {filteredLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedRecipients.includes(lead.id)}
                      onCheckedChange={() => toggleRecipient(lead.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.contactEmail} · {lead.stage}</p>
                    </div>
                    {selectedTemplateId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePersonalizePreview(selectedTemplateId, lead.id);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </Button>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selectedRecipients.length} selected</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCampaignOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={!campaignName || !selectedTemplateId || selectedRecipients.length === 0}>
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personalized Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <DialogTitle>Personalized Preview</DialogTitle>
            </div>
          </DialogHeader>
          {personalizing ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Personalizing content…
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm whitespace-pre-line leading-relaxed">
              {previewContent}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
