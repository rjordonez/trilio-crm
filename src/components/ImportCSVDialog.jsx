import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

function generateLeadsSampleCSV() {
  return `Patient Name,Age,Contact Person,Relationship,Phone,Email,Zip Code,Type of Care,Hours Per Day,Timeline,Budget,Lead Source,Notes
Margaret Johnson,82,Karen Johnson,Daughter / Son,(212) 734-8901,karen.johnson@gmail.com,10024,Personal Care,4–6 hours,Within a week,$30–40/hr,Website,"Mom fell last week and needs help bathing and dressing. Lives alone in a 2BR apartment. Has arthritis in both knees."
Robert Williams,76,Robert Williams,Self,(201) 445-2310,rwilliams76@aol.com,07102,Companion Care,Less than 4 hours,Within a month,Under $30/hr,Digital Ads,"Recently lost wife. Feeling isolated. Wants someone for companionship and light meal prep 3x per week."
Dorothy Brown,89,Michael Brown,Daughter / Son,(718) 963-4521,mbrown.attorney@gmail.com,11201,Dementia / Alzheimer's,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Mother diagnosed with moderate Alzheimer's 2 years ago. Wandering at night. Current caregiver leaving end of month."
James Garcia,71,Maria Garcia,Spouse,(347) 521-8834,maria.garcia.home@yahoo.com,10453,Post-Hospital Recovery,8–12 hours,Immediately,$30–40/hr,Referral Partner,"Husband had hip replacement surgery 3 days ago. Needs help with mobility and wound care for 6-8 weeks."
Helen Miller,94,Susan Miller-Park,Daughter / Son,(914) 337-6612,susan.millerpark@outlook.com,10701,24-Hour Care,24 hour,Within a few days,$50+/hr,Existing Client Referral,"Mom can no longer be alone. Needs round-the-clock care. Has COPD and uses oxygen. Prefers female caregiver."
William Davis,68,William Davis,Self,(212) 889-3345,wdavis68@gmail.com,10016,Personal Care,4–6 hours,Within a month,$30–40/hr,Website,"Parkinson's diagnosis. Tremors making daily tasks difficult. Needs help with meals and medication reminders."
Ruth Rodriguez,87,Carmen Torres,Daughter / Son,(201) 998-7761,carmen.torres@hotmail.com,07030,Companion Care,Less than 4 hours,Just researching,Under $30/hr,Digital Ads,"Looking into options for mom. She's mostly independent but family worries about her being alone all day."
Charles Martinez,79,Linda Martinez,Spouse,(646) 223-5547,lindamartinez@gmail.com,10002,Personal Care,4–6 hours,Within a week,$30–40/hr,Referral Partner,"Husband had a stroke 3 months ago. Left side weakness. Needs help with bathing and physical therapy exercises."
Betty Hernandez,91,Jorge Hernandez,Daughter / Son,(347) 884-2219,jorge.h.care@gmail.com,10468,Dementia / Alzheimer's,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Grandmother with advanced dementia. Aggressive episodes increasing. Looking for experienced memory care aide."
Thomas Lopez,73,Thomas Lopez,Self,(203) 776-4438,tlopez73@yahoo.com,06511,Companion Care,Less than 4 hours,Within a month,Under $30/hr,Event,"Met at senior fair. Wants help with grocery shopping and light housekeeping twice a week."
Patricia Wilson,85,David Wilson,Daughter / Son,(212) 567-8890,dwilson.nyc@gmail.com,10033,Personal Care,8–12 hours,Within a few days,$40–50/hr,Website,"Mother recovering from pneumonia. Very weak. Needs help with all ADLs. Has a cat that caregiver must be okay with."
Richard Anderson,77,Janet Anderson,Spouse,(201) 664-3321,janet.anderson55@aol.com,07024,Post-Hospital Recovery,4–6 hours,Immediately,$30–40/hr,Referral Partner,"Husband discharged after heart bypass. Needs wound care and medication management for 4-6 weeks."
Mary Thomas,88,Patricia Thomas-Lee,Daughter / Son,(718) 638-9914,pthomaslee@gmail.com,11215,24-Hour Care,24 hour,Within a week,$50+/hr,Referral Partner,"Mom had a bad fall. Broken hip. Coming home from rehab next week. Needs 24/7 care at least initially."
Donald Taylor,80,Donald Taylor,Self,(914) 725-5508,dtaylor80@gmail.com,10583,Companion Care,Less than 4 hours,Just researching,Not sure,Website,"Wife passed 6 months ago. Kids live out of state. Wants someone to drive him to appointments and keep company."
Barbara Moore,92,Jennifer Moore,Daughter / Son,(646) 445-1127,jmoore.caregiver@gmail.com,10028,Dementia / Alzheimer's,24 hour,Immediately,$50+/hr,Existing Client Referral,"Mom needs live-in care. Early-stage Alzheimer's progressing. Gets confused at night. Needs patient and gentle caregiver."
George Jackson,74,George Jackson,Self,(347) 229-6643,gjackson74@outlook.com,10467,Personal Care,4–6 hours,Within a month,$30–40/hr,Digital Ads,"Diabetes and neuropathy in feet. Needs help with foot care and meal prep for diabetic diet."
Nancy Martin,86,Robert Martin Jr,Daughter / Son,(203) 348-7756,rmartin.jr@gmail.com,06901,Personal Care,8–12 hours,Within a few days,$40–50/hr,Referral Partner,"Mom broke her wrist. Can't do anything with one hand. Needs temporary help for 8-10 weeks while it heals."
Edward Lee,70,Sophia Lee,Daughter / Son,(212) 431-8829,sophia.lee.nyc@gmail.com,10013,Post-Hospital Recovery,4–6 hours,Immediately,$30–40/hr,Referral Partner,"Father just had knee replacement. Physical therapist recommended home care aide for recovery period."
Carol Gonzalez,83,Maria Gonzalez-Reyes,Daughter / Son,(201) 862-4417,mgonzalezreyes@yahoo.com,07087,Companion Care,Less than 4 hours,Within a week,Under $30/hr,Website,"Mom speaks mainly Spanish. Wants a bilingual caregiver for companionship and light cooking."
Frank Harris,78,Frank Harris,Self,(718) 547-3328,fharris78@aol.com,10462,Personal Care,4–6 hours,Within a month,$30–40/hr,Event,"Has trouble getting in and out of the shower. Wants help with bathing and laundry 3 days a week."
Eleanor Clark,90,Timothy Clark,Daughter / Son,(914) 961-2245,tim.clark.care@gmail.com,10801,24-Hour Care,24 hour,Immediately,$50+/hr,Referral Partner,"Mom was just diagnosed with congestive heart failure. Needs constant monitoring. Lives in a ranch-style home."
Harold Lewis,72,Harold Lewis,Self,(646) 873-5514,hlewis72@gmail.com,10003,Companion Care,Less than 4 hours,Just researching,Under $30/hr,Digital Ads,"Retired teacher. Lonely since retirement. Looking for someone to chat with and help organize his home library."
Virginia Walker,95,Deborah Walker-Kim,Daughter / Son,(347) 665-8837,dwalkerkim@outlook.com,10458,Dementia / Alzheimer's,24 hour,Within a few days,$50+/hr,Referral Partner,"Grandmother with late-stage dementia. Currently in adult day program but needs overnight and weekend coverage."
Albert Hall,69,Susan Hall,Spouse,(203) 562-7741,susan.hall.ct@gmail.com,06510,Post-Hospital Recovery,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Husband recovering from back surgery. Cannot bend or lift. Needs help with everything for 6 weeks."
Shirley Allen,84,Kevin Allen,Daughter / Son,(212) 749-3356,kevinallen.ny@gmail.com,10025,Personal Care,4–6 hours,Within a week,$30–40/hr,Website,"Mother has severe osteoporosis. Very fragile. Needs gentle assistance with mobility and daily activities."
Raymond Young,75,Raymond Young,Self,(201) 339-8824,ryoung75@yahoo.com,07042,Companion Care,Less than 4 hours,Within a month,Under $30/hr,Digital Ads,"Just moved to the area. No local friends or family. Wants companion for outings and social activities."
Martha King,88,Lisa King-Patel,Daughter / Son,(718) 852-4439,lisakingpatel@gmail.com,11217,Personal Care,8–12 hours,Within a few days,$40–50/hr,Existing Client Referral,"Mom's mobility declining rapidly. Uses walker. Needs daily help with bathing and physical therapy exercises."
Howard Wright,81,Howard Wright,Self,(914) 472-6613,hwright81@aol.com,10530,Post-Hospital Recovery,4–6 hours,Immediately,$30–40/hr,Referral Partner,"Just had cataract surgery on both eyes. Temporarily can't drive. Needs help for 2-3 weeks."
Frances Scott,93,Daniel Scott,Daughter / Son,(646) 334-7728,dscott.caretaker@gmail.com,10031,24-Hour Care,24 hour,Immediately,$50+/hr,Referral Partner,"Mother is bedridden. Needs full assistance. Has a Hoyer lift. Caregiver must be experienced with transfers."
Eugene Green,67,Maria Green,Spouse,(347) 778-1145,mariagreen67@hotmail.com,10472,Personal Care,4–6 hours,Within a month,$30–40/hr,Website,"Husband has early-onset Parkinson's. Still fairly independent but needs help with fine motor tasks."
Gladys Adams,87,Christine Adams-Wu,Daughter / Son,(203) 256-9937,cadamswu@gmail.com,06820,Companion Care,Less than 4 hours,Within a week,Under $30/hr,Referral Partner,"Mom is sharp mentally but physically limited. Wants someone to take her to church and run errands."
Arthur Baker,79,Arthur Baker,Self,(212) 662-4418,abaker79@gmail.com,10027,Personal Care,8–12 hours,Within a few days,$40–50/hr,Digital Ads,"Had a minor stroke. Recovering well but right arm is weak. Needs help with daily tasks while doing OT."
Edna Nelson,91,Mark Nelson,Daughter / Son,(201) 796-3329,mark.nelson.nj@yahoo.com,07652,Dementia / Alzheimer's,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Mom has moderate dementia. Leaves stove on. Got lost walking to the mailbox. Needs supervision during the day."
Walter Carter,74,Walter Carter,Self,(718) 291-5547,wcarter74@outlook.com,11432,Post-Hospital Recovery,4–6 hours,Immediately,$30–40/hr,Event,"Discharged from hospital after blood clot. On blood thinners. Needs help with injections and monitoring."
Mildred Mitchell,86,Sarah Mitchell-Jones,Daughter / Son,(914) 238-8834,smitchelljones@gmail.com,10591,Personal Care,4–6 hours,Within a week,$30–40/hr,Website,"Mom has macular degeneration. Legally blind. Needs help navigating home and preparing meals."
Herman Perez,71,Carmen Perez,Spouse,(646) 559-2216,carmenperez.care@gmail.com,10040,Companion Care,Less than 4 hours,Within a month,Under $30/hr,Digital Ads,"Husband recovering from depression after retirement. Therapist suggested a companion to help with routine."
Lucille Roberts,89,Amy Roberts,Daughter / Son,(347) 443-7738,amy.roberts.bx@gmail.com,10469,24-Hour Care,24 hour,Within a few days,$50+/hr,Referral Partner,"Mom has severe COPD and uses oxygen 24/7. Can't be alone. Current night aide is leaving."
Clarence Turner,77,Clarence Turner,Self,(203) 874-1149,cturner77@aol.com,06516,Personal Care,4–6 hours,Just researching,$30–40/hr,Website,"Knee replacement scheduled next month. Looking into post-op home care options in advance."
Rose Phillips,83,Michael Phillips,Daughter / Son,(212) 927-6625,mphillips.nyc@gmail.com,10032,Personal Care,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Mother fell and broke femur. Coming home from rehab facility. Needs skilled aide for recovery."
Stanley Campbell,80,Jane Campbell,Spouse,(201) 568-4432,janecampbell@yahoo.com,07110,Companion Care,Less than 4 hours,Within a week,Under $30/hr,Existing Client Referral,"Husband is a veteran with PTSD. VA recommended companion care. Prefers male caregiver."
Irene Parker,96,David Parker,Daughter / Son,(718) 789-3317,dparker.brooklyn@gmail.com,11225,Dementia / Alzheimer's,24 hour,Immediately,$50+/hr,Referral Partner,"Mom is 96 with advanced Alzheimer's. Needs patient caregiver experienced with sundowning behavior."
Louis Evans,73,Louis Evans,Self,(914) 631-8846,levans73@gmail.com,10562,Post-Hospital Recovery,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Just had double bypass surgery. Needs cardiac rehab support at home and dietary meal prep."
Hazel Edwards,85,Jennifer Edwards-Cho,Daughter / Son,(646) 887-2234,jedwardcho@outlook.com,10009,Personal Care,4–6 hours,Within a few days,$30–40/hr,Website,"Mom is diabetic. Needs insulin monitoring and diabetic-friendly meal prep. Also help with bathing."
Norman Collins,78,Norman Collins,Self,(347) 334-9951,ncollins78@hotmail.com,10466,Companion Care,Less than 4 hours,Within a month,Under $30/hr,Digital Ads,"Lives alone in the Bronx. Wants someone to go on walks with and help with grocery shopping."
Thelma Stewart,90,Laura Stewart-Kim,Daughter / Son,(203) 661-5543,lstewartkim@gmail.com,06830,24-Hour Care,24 hour,Within a week,$50+/hr,Existing Client Referral,"Mom needs live-in aide. Has a large home in Greenwich. Caregiver will have private room. Must drive."
Chester Sanchez,66,Rosa Sanchez,Spouse,(212) 568-7729,rosa.sanchez.ny@gmail.com,10034,Post-Hospital Recovery,4–6 hours,Immediately,$30–40/hr,Referral Partner,"Husband had spinal fusion surgery. Strict movement restrictions. Needs help for 8-12 weeks recovery."
Bertha Morris,84,Thomas Morris,Daughter / Son,(201) 447-6618,tmorris.nj@gmail.com,07450,Personal Care,8–12 hours,Within a few days,$40–50/hr,Referral Partner,"Mom has Parkinson's. Tremors getting worse. Falls risk increasing. Needs daily hands-on assistance."
Lester Rogers,76,Lester Rogers,Self,(718) 624-1142,lrogers76@aol.com,11201,Companion Care,Less than 4 hours,Just researching,Not sure,Event,"Met at Brooklyn senior center event. Interested in learning about companion care services."
Viola Reed,88,Christine Reed-Park,Daughter / Son,(914) 834-3357,creedpark@gmail.com,10804,Dementia / Alzheimer's,8–12 hours,Immediately,$40–50/hr,Referral Partner,"Mom wanders and has been found outside in her nightgown. Needs a caregiver experienced with elopement risk."
Floyd Cook,70,Floyd Cook,Self,(646) 221-4436,fcook70@gmail.com,10011,Personal Care,4–6 hours,Within a month,$30–40/hr,Website,"Recently diagnosed with MS. Starting to have balance issues. Wants proactive help before things get worse."`;
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
    } catch (err) {
      console.error("Import error:", err);
      setErrorMsg(err?.message || "Import failed. Please try again.");
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
