import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

function generateLeadsSampleCSV() {
  const header = "Patient Name,Age,Contact Person,Relationship,Phone,Email,Zip Code,Type of Care,Hours Per Day,Timeline,Budget,Lead Source,Notes";
  const firstNames = ["Margaret","Robert","Dorothy","James","Helen","William","Ruth","Charles","Betty","Thomas","Patricia","Richard","Mary","Donald","Barbara","George","Nancy","Edward","Carol","Frank"];
  const lastNames = ["Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee"];
  const relationships = ["Self","Daughter / Son","Spouse","Relative","Hospital / Social Worker"];
  const careTypes = ["Companion Care","Personal Care","Dementia / Alzheimer's","Post-Hospital Recovery","24-Hour Care","Not Sure Yet"];
  const hours = ["Less than 4 hours","4–6 hours","8–12 hours","Overnight","24 hour","Not sure"];
  const timelines = ["Immediately","Within a few days","Within a week","Within a month","Just researching"];
  const budgets = ["Under $30/hr","$30–40/hr","$40–50/hr","$50+/hr","Not sure"];
  const sources = ["Website","Digital Ads","Referral Partner","Existing Client Referral","Event","Other"];
  const zips = ["10001","10002","10003","10004","10005","10006","10007","10008","10009","10010","07001","07002","07003","07004","07005","06001","06002","06003","06004","06005"];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rows = [];

  for (let i = 0; i < 50; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const age = 65 + Math.floor(Math.random() * 30);
    const rel = pick(relationships);
    const contactFn = firstNames[(i + 7) % firstNames.length];
    const contactLn = ln;
    const phone = `(${201 + Math.floor(Math.random() * 800)}) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`;
    const email = `${contactFn.toLowerCase()}.${contactLn.toLowerCase()}@email.com`;
    const zip = zips[i % zips.length];
    const care = pick(careTypes);
    const h = pick(hours);
    const t = pick(timelines);
    const b = pick(budgets);
    const s = pick(sources);
    const notes = [
      "Needs assistance with daily activities",
      "Recently discharged from hospital",
      "Looking for weekend coverage",
      "Family seeking long-term care solution",
      "Post-surgery recovery care needed",
      "Spouse can no longer provide full-time care",
      "Referred by physician",
      "Wants live-in caregiver",
      "Needs medication management support",
      "Looking for bilingual caregiver",
    ][i % 10];

    rows.push(`${fn} ${ln},${age},${contactFn} ${contactLn},${rel},${phone},${email},${zip},${care},${h},${t},${b},${s},"${notes}"`);
  }

  return header + "\n" + rows.join("\n");
}

function generateReferrersSampleCSV() {
  const header = "Partner Name,Primary Contact Person,Title,Email,Phone,Partner Type,Notes";
  const partners = [
    ["Mercy General Hospital","Dr. Sarah Chen","Director of Discharge Planning","sarah.chen@mercygeneral.org","(212) 555-0101","Hospital / Facility","Major referral source for post-hospital recovery patients"],
    ["Sunrise Home Health","Maria Gonzalez","Client Services Manager","maria.g@sunrisehh.com","(201) 555-0202","Home Health Agency","Refers overflow cases and complex care needs"],
    ["Dr. James Park Neurology","James Park","Neurologist","jpark@parkneuro.com","(212) 555-0303","Physician / Clinician","Refers dementia and Alzheimer's patients"],
    ["Community Care Alliance","Lisa Thompson","Program Director","lisa.t@ccalliance.org","(718) 555-0404","Community Organization / Nonprofit","Partners on low-income senior care programs"],
    ["Riverside Senior Living","Tom Bradley","Placement Coordinator","tbradley@riversidesl.com","(914) 555-0505","Placement Specialist","Sends referrals when their facility is at capacity"],
    ["Memorial Hospital Social Services","Angela Martinez","Senior Social Worker","amartinez@memorial.org","(212) 555-0606","Social Worker / Case Manager","High-volume referral partner for discharge planning"],
    ["Elder Care Solutions","David Kim","Owner","dkim@eldercaresolutions.com","(201) 555-0707","Home Health Agency","Refers cases needing specialized dementia care"],
    ["The Garcia Family","Rosa Garcia","Family Member","rosa.garcia@email.com","(347) 555-0808","Current Client / Family","Happy client family who refers neighbors and friends"],
    ["Northeast Rehab Center","Dr. Patricia Moore","Medical Director","pmoore@northeastrehab.com","(203) 555-0909","Hospital / Facility","Refers post-surgery and post-stroke recovery patients"],
    ["Senior Advocates Inc","Karen Wilson","Case Manager","kwilson@senioradvocates.org","(212) 555-1010","Social Worker / Case Manager","Works with families navigating elder care options"],
  ];

  const rows = partners.map(([name, contact, title, email, phone, type, notes]) =>
    `${name},${contact},${title},${email},${phone},${type},"${notes}"`
  );

  return header + "\n" + rows.join("\n");
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || "").trim();
    });
    return row;
  }).filter((row) => Object.values(row).some((v) => v));
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function csvRowToLead(row, userName) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const name = row["Patient Name"] || "Unknown";
  const contactPerson = row["Contact Person"] || name;
  const contactInfo = row["Phone"] || row["Email"] || "";
  const source = row["Lead Source"] || "Other";

  return {
    id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    age: row["Age"] || "",
    contactPerson,
    contactRelation: row["Relationship"] || "",
    contactPhone: row["Phone"] || "",
    contactEmail: row["Email"] || "",
    careLevel: row["Type of Care"] || "Not Sure Yet",
    hoursPerDay: row["Hours Per Day"] || "",
    lastContactDate: dateStr,
    facility: "",
    stage: "inquiry",
    score: "cold",
    source,
    referrerId: null,
    inquiryDate: dateStr,
    initialContact: dateStr,
    nextActivity: "Follow-up call scheduled",
    salesRep: userName,
    budget: row["Budget"] || "",
    timeline: row["Timeline"] || "",
    intakeNote: {
      leadSource: source,
      zipcode: row["Zip Code"] || "",
      caller: contactPerson,
      dateTime: now.toLocaleString(),
      salesRep: userName,
      situationSummary: row["Notes"] ? [row["Notes"]] : [],
      careNeeds: row["Type of Care"] ? [`${row["Type of Care"]} care needed`] : [],
      budgetFinancial: row["Budget"] ? [row["Budget"]] : [],
      decisionMakers: contactPerson ? [contactPerson] : [],
      timeline: row["Timeline"] || "",
      preferences: [],
      objections: [],
      salesRepAssessment: [],
      nextStep: [],
    },
    interactions: [],
    callTranscripts: [],
  };
}

function csvRowToReferrer(row) {
  return {
    id: `import-ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: row["Partner Name"] || "Unknown",
    organization: row["Partner Name"] || "Unknown",
    type: row["Partner Type"] || "Other",
    contactPerson: row["Primary Contact Person"] || "",
    contactTitle: row["Title"] || "",
    phone: row["Phone"] || "",
    email: row["Email"] || "",
    notes: row["Notes"] || "",
    referredLeadIds: [],
    serviceHoursRequested: 0,
    commissionRate: 0,
    totalCommission: 0,
    status: "active",
    lastReferralDate: new Date().toISOString().split("T")[0],
  };
}

export default function ImportCSVDialog({ open, onOpenChange, type, onImport, userName }) {
  const [status, setStatus] = useState("idle"); // idle | preview | importing | done | error
  const [parsed, setParsed] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef(null);

  const isLeads = type === "leads";
  const sampleCSV = isLeads ? generateLeadsSampleCSV() : generateReferrersSampleCSV();

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isLeads ? "sample_leads.csv" : "sample_referrers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length === 0) {
          setErrorMsg("No data rows found in CSV.");
          setStatus("error");
          return;
        }
        setParsed(rows);
        setStatus("preview");
      } catch {
        setErrorMsg("Failed to parse CSV file.");
        setStatus("error");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStatus("importing");
    try {
      const items = isLeads
        ? parsed.map((row) => csvRowToLead(row, userName))
        : parsed.map((row) => csvRowToReferrer(row));
      await onImport(items);
      setStatus("done");
    } catch {
      setErrorMsg("Import failed. Please try again.");
      setStatus("error");
    }
  };

  const handleClose = (open) => {
    if (!open) {
      setStatus("idle");
      setParsed([]);
      setErrorMsg("");
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {isLeads ? "Leads" : "Referral Partners"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {status === "idle" && (
            <>
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Upload a CSV file to import {isLeads ? "leads" : "referral partners"}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Choose CSV File
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleDownloadSample}>
                <Download className="h-3.5 w-3.5" />
                Download Sample CSV ({isLeads ? "50 leads" : "10 partners"})
              </Button>
            </>
          )}

          {status === "preview" && (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">{parsed.length} {isLeads ? "leads" : "partners"} found</p>
                </div>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-3 text-muted-foreground font-medium">#</th>
                        <th className="text-left py-1 pr-3 text-muted-foreground font-medium">{isLeads ? "Patient Name" : "Partner Name"}</th>
                        <th className="text-left py-1 text-muted-foreground font-medium">{isLeads ? "Type of Care" : "Type"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1 pr-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-1 pr-3 text-foreground">{isLeads ? row["Patient Name"] : row["Partner Name"]}</td>
                          <td className="py-1 text-muted-foreground">{isLeads ? row["Type of Care"] : row["Partner Type"]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-1">...and {parsed.length - 10} more</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStatus("idle"); setParsed([]); if (fileRef.current) fileRef.current.value = ""; }}>
                  Back
                </Button>
                <Button className="flex-1 gap-1.5" onClick={handleImport}>
                  <Upload className="h-3.5 w-3.5" />
                  Import {parsed.length} {isLeads ? "Leads" : "Partners"}
                </Button>
              </div>
            </>
          )}

          {status === "importing" && (
            <div className="py-8 text-center space-y-2">
              <div className="h-6 w-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Importing...</p>
            </div>
          )}

          {status === "done" && (
            <div className="py-8 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-primary mx-auto" />
              <p className="text-sm font-medium text-foreground">Successfully imported {parsed.length} {isLeads ? "leads" : "partners"}!</p>
              <Button size="sm" onClick={() => handleClose(false)}>Done</Button>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button size="sm" variant="outline" onClick={() => { setStatus("idle"); setErrorMsg(""); }}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
