import { useState, useMemo, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { fetchReferrers, createReferrer } from "@/services/supabaseReferrers";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, User, Phone, Mail, Clock,
  TrendingUp, ChevronRight, Users, FileText, ExternalLink, ArrowUpDown, ArrowUpRight, ArrowDownRight, Handshake,
} from "lucide-react";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import AddPartnerSheet from "@/components/AddPartnerSheet";

const stageLabels = {
  inquiry: "Inquiry", connection: "Connection", pre_tour: "Pre-Tour",
  post_tour: "Post-Tour", deposit: "Deposit", move_in: "Move-in",
};

export default function ReferrersPage({ leads = [] }) {
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [editingHours, setEditingHours] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState(new Set());
  const [filterPartner, setFilterPartner] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterRep, setFilterRep] = useState("all");
  const [filterCare, setFilterCare] = useState("all");
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const [localReferrers, setLocalReferrers] = useState([]);

  useEffect(() => {
    fetchReferrers().then(setLocalReferrers).catch(console.error);
  }, []);

  const totalReferrals = localReferrers.reduce((s, r) => s + r.referredLeadIds.length, 0);
  const activePartners = localReferrers.filter((r) => r.status === "active").length;

  // Referrer snapshot KPIs
  const referralLeads = leads.filter(l => l.source === "Referral");
  const referralCalled = referralLeads.filter(l => ["connection", "pre_tour", "post_tour", "deposit", "move_in"].includes(l.stage));
  const referralClosed = referralLeads.filter(l => ["deposit", "move_in"].includes(l.stage));
  const convRefToCall = referralLeads.length > 0 ? Math.round((referralCalled.length / referralLeads.length) * 100) : 0;
  const convRefToClose = referralLeads.length > 0 ? Math.round((referralClosed.length / referralLeads.length) * 100) : 0;
  const convCallToClose = referralCalled.length > 0 ? Math.round((referralClosed.length / referralCalled.length) * 100) : 0;

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = useMemo(() => {
    const arr = [...localReferrers];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "type": return dir * a.type.localeCompare(b.type);
        case "contact": return dir * a.contactPerson.localeCompare(b.contactPerson);
        case "referrals": return dir * (a.referredLeadIds.length - b.referredLeadIds.length);
        default: return 0;
      }
    });
    return arr;
  }, [sortKey, sortDir, localReferrers]);

  // All referred leads across all partners with hours
  const allReferredLeads = useMemo(() => {
    const result = [];
    localReferrers.forEach(r => {
      const perLead = Math.round(r.serviceHoursRequested / Math.max(r.referredLeadIds.length, 1));
      r.referredLeadIds.forEach(id => {
        const lead = leads.find(l => l.id === id);
        if (lead) {
          result.push({ ...lead, rowKey: `${r.id}-${lead.id}`, hours: editingHours[`${r.id}-${lead.id}`] ?? perLead, partnerName: r.name, partnerId: r.id });
        }
      });
    });
    return result;
  }, [editingHours, localReferrers, leads]);

  // Filter options
  const uniquePartners = [...new Set(allReferredLeads.map(l => l.partnerName))];
  const uniqueStages = [...new Set(allReferredLeads.map(l => l.stage))];
  const uniqueReps = [...new Set(allReferredLeads.map(l => l.salesRep))];
  const uniqueCare = [...new Set(allReferredLeads.map(l => l.careLevel))];

  const filteredLeads = useMemo(() => {
    return allReferredLeads.filter(l =>
      (filterPartner === "all" || l.partnerName === filterPartner) &&
      (filterStage === "all" || l.stage === filterStage) &&
      (filterRep === "all" || l.salesRep === filterRep) &&
      (filterCare === "all" || l.careLevel === filterCare)
    );
  }, [allReferredLeads, filterPartner, filterStage, filterRep, filterCare]);

  const displayedTotalHours = useMemo(() => {
    const subset = selectedRowKeys.size > 0 ? filteredLeads.filter(l => selectedRowKeys.has(l.rowKey)) : filteredLeads;
    return subset.reduce((s, l) => s + (editingHours[l.rowKey] ?? l.hours), 0);
  }, [filteredLeads, selectedRowKeys, editingHours]);

  const SortableHead = ({ label, sortKeyVal }) => (
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(sortKeyVal)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyVal ? "text-foreground" : "text-muted-foreground/40"}`} />
      </span>
    </TableHead>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Referrers" subtitle="Referral Management" action={{ label: "Add Partner", onClick: () => setAddPartnerOpen(true) }} />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Referrer Snapshot */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SnapshotKPI icon={Users} label="Active Partners" value={activePartners} />
          <SnapshotKPI icon={TrendingUp} label="Total Referrals" value={totalReferrals} />
          <SnapshotKPI label="Ref → Call" value={`${convRefToCall}%`} prev={55} current={convRefToCall} />
          <SnapshotKPI label="Ref → Close" value={`${convRefToClose}%`} prev={20} current={convRefToClose} />
          <SnapshotKPI label="Call → Close" value={`${convCallToClose}%`} prev={30} current={convCallToClose} />
        </div>

        {/* Partners table */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            Partners ({localReferrers.length})
          </h3>
          <div className="rounded-lg border border-border bg-card shadow-crm-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Partner" sortKeyVal="name" />
                  <SortableHead label="Type" sortKeyVal="type" />
                  <SortableHead label="Contact" sortKeyVal="contact" />
                  <TableHead className="text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("referrals")}>
                    <span className="inline-flex items-center gap-1 justify-center">
                      Referrals
                      <ArrowUpDown className={`h-3 w-3 ${sortKey === "referrals" ? "text-foreground" : "text-muted-foreground/40"}`} />
                    </span>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedReferrer(r)}>
                    <TableCell>
                      <p className="font-medium text-foreground text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.organization}</p>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{r.type}</span></TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{r.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">{r.phone}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-display font-semibold text-foreground">{r.referredLeadIds.length}</span>
                    </TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Referred Leads Table */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Referred Leads ({filteredLeads.length})
          </h3>
          <div className="rounded-lg border border-border bg-card shadow-crm-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredLeads.length > 0 && filteredLeads.every(l => selectedRowKeys.has(l.rowKey))}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedRowKeys(new Set(filteredLeads.map(l => l.rowKey)));
                        else setSelectedRowKeys(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <Select value={filterPartner} onValueChange={setFilterPartner}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-0 w-auto min-w-[80px]">
                        <SelectValue placeholder="Partner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Partners</SelectItem>
                        {uniquePartners.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead>
                    <Select value={filterStage} onValueChange={setFilterStage}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-0 w-auto min-w-[70px]">
                        <SelectValue placeholder="Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {uniqueStages.map(s => <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead>
                    <Select value={filterRep} onValueChange={setFilterRep}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-0 w-auto min-w-[80px]">
                        <SelectValue placeholder="Sales Rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reps</SelectItem>
                        {uniqueReps.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead>
                    <Select value={filterCare} onValueChange={setFilterCare}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-0 w-auto min-w-[80px]">
                        <SelectValue placeholder="Care Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueCare.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.rowKey} className={`cursor-pointer ${selectedRowKeys.has(lead.rowKey) ? "bg-muted/50" : ""}`} onClick={() => setSelectedLead(lead)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRowKeys.has(lead.rowKey)}
                        onCheckedChange={(checked) => {
                          setSelectedRowKeys(prev => {
                            const next = new Set(prev);
                            checked ? next.add(lead.rowKey) : next.delete(lead.rowKey);
                            return next;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-primary underline underline-offset-2">{lead.name}</p>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{lead.partnerName}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">{stageLabels[lead.stage]}</Badge>
                    </TableCell>
                    <TableCell><span className="text-sm text-foreground">{lead.salesRep}</span></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px]">{lead.careLevel}</Badge>
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="number"
                        className="w-16 h-7 text-center text-sm mx-auto"
                        value={editingHours[lead.rowKey] ?? lead.hours}
                        onChange={(e) => setEditingHours(prev => ({ ...prev, [lead.rowKey]: parseInt(e.target.value) || 0 }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right text-sm font-semibold text-foreground">
                    Total Hours {selectedRowKeys.size > 0 ? `(${selectedRowKeys.size} selected)` : `(${filteredLeads.length} leads)`}
                  </TableCell>
                  <TableCell className="text-center font-display text-base font-bold text-foreground">
                    {displayedTotalHours}h
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </div>

      {/* Referrer Detail Dialog */}
      {selectedReferrer && (
        <ReferrerDetailDialog
          referrer={selectedReferrer}
          open={!!selectedReferrer}
          onClose={() => setSelectedReferrer(null)}
          onLeadClick={(lead) => { setSelectedReferrer(null); setSelectedLead(lead); }}
          allLeads={leads}
        />
      )}

      {/* Lead Detail Dialog */}
      <LeadDetailDialog lead={selectedLead} open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }} />

      {/* Add Partner Sheet */}
      <AddPartnerSheet
        open={addPartnerOpen}
        onOpenChange={setAddPartnerOpen}
        onAdd={async (partner) => {
          try {
            const saved = await createReferrer(partner);
            setLocalReferrers(prev => [...prev, saved]);
          } catch (err) {
            console.error('Failed to create referrer:', err);
          }
        }}
      />
    </div>
  );
}

function SnapshotKPI({ icon: Icon, label, value, prev, current }) {
  const hasDiff = prev !== undefined && current !== undefined;
  const diff = hasDiff ? current - prev : 0;
  const up = diff >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-crm-sm text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />}
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
      {hasDiff && (
        <p className={`text-[10px] font-medium flex items-center justify-center gap-0.5 ${up ? "text-primary" : "text-destructive"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {up ? "+" : ""}{diff}% vs prev
        </p>
      )}
    </div>
  );
}

function ReferrerDetailDialog({ referrer, open, onClose, onLeadClick, allLeads = [] }) {
  const referredLeads = allLeads.filter((l) => referrer.referredLeadIds.includes(l.id));
  const leadsWithHours = referredLeads.map((lead) => {
    const hours = Math.round(referrer.serviceHoursRequested / Math.max(referrer.referredLeadIds.length, 1));
    return { ...lead, hours };
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {referrer.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={FileText} label="Type" value={referrer.type} />
            <InfoRow icon={Phone} label="Main Phone" value={referrer.phone} />
            <InfoRow icon={Mail} label="Main Email" value={referrer.email} />
          </div>
          {referrer.contacts && referrer.contacts.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Contacts ({referrer.contacts.length})
              </h4>
              <div className="space-y-2">
                {referrer.contacts.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.role}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <InfoRow icon={User} label="Contact" value={referrer.contactPerson} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Total Referrals</p>
              <p className="font-display text-xl font-bold text-foreground">{referredLeads.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Total Service Hours</p>
              <p className="font-display text-xl font-bold text-foreground">{referrer.serviceHoursRequested}h</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Referred Leads ({referredLeads.length})
            </h4>
            {leadsWithHours.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No leads referred yet</p>
            ) : (
              <div className="space-y-2">
                {leadsWithHours.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-border p-3 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => onLeadClick(lead)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-primary underline underline-offset-2">{lead.name}</p>
                        <Badge variant="outline" className="text-[10px]">{stageLabels[lead.stage]}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{lead.careLevel}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Sales Rep: <span className="font-medium text-foreground">{lead.salesRep}</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> <span className="font-medium text-foreground">{lead.hours}h</span> service hours
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            <p className="text-xs font-medium text-foreground mb-1">Notes</p>
            <p className="text-xs text-muted-foreground">{referrer.notes}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
