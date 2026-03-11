







export const salespeople = [
  { name: "Sarah Johnson", color: "hsl(205, 65%, 48%)" },
  { name: "Mike Peters", color: "hsl(228, 80%, 65%)" },
  { name: "Emily Brown", color: "hsl(38, 92%, 55%)" },
  { name: "David Kim", color: "hsl(270, 50%, 55%)" },
];

export const leadSourceData = [
  { name: "Digital Ads", value: 32, fill: "hsl(205, 65%, 48%)" },
  { name: "Website", value: 24, fill: "hsl(228, 80%, 65%)" },
  { name: "Phone Call", value: 18, fill: "hsl(38, 92%, 55%)" },
  { name: "Walk-in", value: 10, fill: "hsl(270, 50%, 55%)" },
  { name: "Referral", value: 16, fill: "hsl(0, 72%, 56%)" },
  { name: "Event", value: 12, fill: "hsl(160, 60%, 45%)" },
];

export const funnelData = [
  { stage: "Inquiry", count: 8, fill: "hsl(205, 65%, 48%)" },
  { stage: "Connection", count: 5, fill: "hsl(38, 92%, 55%)" },
  { stage: "Pre-Tour", count: 3, fill: "hsl(228, 80%, 65%)" },
  { stage: "Post-Tour", count: 3, fill: "hsl(270, 50%, 55%)" },
  { stage: "Deposit", count: 2, fill: "hsl(0, 72%, 56%)" },
  { stage: "Move-in", count: 1, fill: "hsl(228, 75%, 55%)" },
];

// Helper to generate call transcripts for leads with call/tour history
function generateCallTranscripts(lead) {
  const rep = lead.salesRep;
  const contact = lead.contactPerson === "Self" ? lead.name : lead.contactPerson;
  const transcripts = [];

  // Initial intake call transcript
  transcripts.push({
    id: `${lead.id}-tr1`,
    date: lead.initialContact.replace("2026-", "").replace("-", "/"),
    time: "9:53 AM",
    duration: "7:44",
    durationSeconds: 464,
    talkPercent: 53,
    talkTime: "4:05",
    listenPercent: 47,
    listenTime: "3:39",
    type: "call",
    repName: rep,
    contactName: contact,
    messages: [
      { speaker: "rep", text: `Hi, this is ${rep} from ${lead.facility}. Am I speaking with ${contact}?`, timestamp: "0:02" },
      { speaker: "contact", text: `Yes, hi! Thanks for calling back. I submitted an inquiry online.`, timestamp: "0:07" },
      { speaker: "rep", text: `Of course! I'd love to learn more about what you're looking for. How's everything going?`, timestamp: "0:16" },
      { speaker: "contact", text: `${lead.intakeNote.situationSummary[0]}. ${lead.intakeNote.situationSummary[1] || "We're just starting to explore options."}`, timestamp: "0:19", highlight: true },
      { speaker: "rep", text: `I understand. That's actually very common. When did this all start becoming a concern?`, timestamp: "0:34" },
      { speaker: "contact", text: `It's been building for a few months. ${lead.intakeNote.careNeeds[0]}, and ${lead.intakeNote.careNeeds[1]?.toLowerCase() || "things are getting harder to manage"}.`, timestamp: "0:37" },
      { speaker: "rep", text: `Thank you for sharing that. I want to make sure we find the right fit. Can you tell me about your budget range and how you're planning to finance this?`, timestamp: "1:12", highlight: true },
      { speaker: "contact", text: `${lead.intakeNote.budgetFinancial[0]}. ${lead.intakeNote.budgetFinancial[1] || ""}`, timestamp: "1:25" },
      { speaker: "rep", text: `That's very helpful. And who else is involved in making this decision?`, timestamp: "2:01" },
      { speaker: "contact", text: `${lead.intakeNote.decisionMakers.join(". ")}`, timestamp: "2:10" },
      { speaker: "rep", text: `Perfect. Let me tell you about our ${lead.careLevel.toLowerCase()} program and what makes our community special...`, timestamp: "2:45" },
      { speaker: "contact", text: `That sounds great. ${lead.intakeNote.objections[0] || "I do have some concerns though."}`, timestamp: "4:30" },
      { speaker: "rep", text: `I completely understand that concern. We have a wonderful transition support team. Would you like to schedule a tour so you can see the community in person?`, timestamp: "5:15", highlight: true },
      { speaker: "contact", text: `Yes, I think that would be really helpful. ${lead.intakeNote.timeline}.`, timestamp: "6:02" },
      { speaker: "rep", text: `Wonderful! ${lead.intakeNote.nextStep[0]}. I'll also send you some information via email. Is there anything else I can help with today?`, timestamp: "6:45" },
      { speaker: "contact", text: `No, that covers everything. Thank you so much for your time and patience.`, timestamp: "7:20" },
      { speaker: "rep", text: `Of course! We're here to help every step of the way. I'll be in touch soon. Take care!`, timestamp: "7:35" },
    ],
  });

  // Follow-up call for leads past inquiry stage
  if (["connection", "pre_tour", "post_tour", "deposit", "move_in"].includes(lead.stage)) {
    transcripts.push({
      id: `${lead.id}-tr2`,
      date: lead.lastContactDate.replace("2026-", "").replace("-", "/"),
      time: "2:30 PM",
      duration: "5:22",
      durationSeconds: 322,
      talkPercent: 45,
      talkTime: "2:25",
      listenPercent: 55,
      listenTime: "2:57",
      type: "call",
      repName: rep,
      contactName: contact,
      messages: [
        { speaker: "rep", text: `Hi ${contact}, it's ${rep} from ${lead.facility}. How are you doing today?`, timestamp: "0:02" },
        { speaker: "contact", text: `Hi ${rep.split(" ")[0]}! Good, thanks for following up.`, timestamp: "0:08" },
        { speaker: "rep", text: `Of course! I wanted to check in and see if you had any questions after reviewing the materials I sent.`, timestamp: "0:15" },
        { speaker: "contact", text: `Actually yes. ${lead.intakeNote.objections[0] || "I was wondering about the daily schedule and activities."}`, timestamp: "0:22", highlight: true },
        { speaker: "rep", text: `That's a great question. Let me walk you through how we handle that...`, timestamp: "0:45" },
        { speaker: "contact", text: `That makes me feel a lot better. ${lead.intakeNote.preferences[0] || "The community sounds like a great fit."}`, timestamp: "2:30" },
        { speaker: "rep", text: `I'm glad to hear that! ${lead.intakeNote.nextStep[0] || "Let's plan our next steps."}`, timestamp: "3:15", highlight: true },
        { speaker: "contact", text: `Sounds perfect. Thank you for being so thorough.`, timestamp: "4:50" },
        { speaker: "rep", text: `That's what we're here for. I'll send a confirmation email shortly. Talk soon!`, timestamp: "5:10" },
      ],
    });
  }

  // Tour transcripts from tour notes
  const tours = lead.tourNotes || [];
  tours.forEach((tourNote, idx) => {
    const tourNum = tours.length > 1 ? ` #${idx + 1}` : "";
    transcripts.push({
      id: `${lead.id}-tr-tour${idx + 1}`,
      date: tourNote.tourDate.replace("2026-", "").replace("-", "/"),
      time: "11:00 AM",
      duration: "12:18",
      durationSeconds: 738,
      talkPercent: 60,
      talkTime: "7:23",
      listenPercent: 40,
      listenTime: "4:55",
      type: "tour",
      repName: tourNote.tourGuide,
      contactName: tourNote.attendees,
      messages: [
        { speaker: "rep", text: `Welcome to ${lead.facility}! I'm ${tourNote.tourGuide}, and I'll be your guide today.`, timestamp: "0:05" },
        { speaker: "contact", text: `Thank you! We're really looking forward to seeing the community.`, timestamp: "0:15" },
        { speaker: "rep", text: `Let me show you around our common areas and available rooms...`, timestamp: "0:30" },
        { speaker: "contact", text: `This looks wonderful. Can you tell us more about the daily activities?`, timestamp: "4:30" },
        { speaker: "rep", text: `Absolutely! We have a full calendar of events and activities.`, timestamp: "5:00" },
        { speaker: "contact", text: `Thank you for the wonderful tour${tourNum}!`, timestamp: "12:05" },
      ],
    });
  });

  return transcripts;
}

// Helper to generate interactions for each lead based on their stage
function generateInteractions(lead) {
  const rep = lead.salesRep;
  const contact = lead.contactPerson === "Self" ? lead.name : lead.contactPerson;
  const entries = [
    { id: `${lead.id}-i1`, date: lead.inquiryDate, type: "note", title: "Inquiry received", description: `New inquiry from ${contact} via ${lead.source.toLowerCase()}. Care level: ${lead.careLevel}.`, by: "System" },
    { id: `${lead.id}-i2`, date: lead.initialContact, type: "call", title: "Initial contact call", description: `First call with ${contact}. Discussed care needs and community options. ${lead.intakeNote.situationSummary[0]}.`, by: rep },
  ];

  if (["connection", "pre_tour", "post_tour", "deposit", "move_in"].includes(lead.stage)) {
    entries.push(
      { id: `${lead.id}-i3`, date: lead.initialContact, type: "email", title: "Sent information packet", description: `Emailed brochure, pricing sheet, and community overview to ${contact}.`, by: rep },
      { id: `${lead.id}-i4`, date: lead.initialContact, type: "stage_change", title: "Moved to Connection", description: `Lead advanced from Inquiry to Connection stage.`, by: rep },
    );
  }

  if (["pre_tour", "post_tour", "deposit", "move_in"].includes(lead.stage)) {
    entries.push(
      { id: `${lead.id}-i5`, date: lead.lastContactDate, type: "call", title: "Follow-up call", description: `Discussed specific care needs and answered questions. ${contact} expressed interest in touring.`, by: rep },
      { id: `${lead.id}-i6`, date: lead.lastContactDate, type: "stage_change", title: "Moved to Pre-Tour", description: `Tour scheduled. Lead advanced to Pre-Tour stage.`, by: rep },
    );
  }

  if (["post_tour", "deposit", "move_in"].includes(lead.stage)) {
    const tours = lead.tourNotes || [];
    tours.forEach((tourNote, idx) => {
      const tourNum = tours.length > 1 ? ` (#${idx + 1})` : "";
      entries.push(
        { id: `${lead.id}-tour-${idx}`, date: tourNote.tourDate, type: "tour", title: `Facility tour${tourNum}`, description: tourNote.summary, by: tourNote.tourGuide || rep, tourNote },
      );
    });
    entries.push(
      { id: `${lead.id}-i9`, date: lead.lastContactDate, type: "stage_change", title: "Moved to Post-Tour", description: `Lead advanced to Post-Tour stage after facility visit.`, by: rep },
    );
  }

  if (["deposit", "move_in"].includes(lead.stage)) {
    entries.push(
      { id: `${lead.id}-i10`, date: lead.lastContactDate, type: "call", title: "Deposit discussion call", description: `Discussed pricing, room options, and move-in timeline with ${contact}.`, by: rep },
      { id: `${lead.id}-i11`, date: lead.lastContactDate, type: "stage_change", title: "Moved to Deposit", description: `Deposit received. Lead advanced to Deposit stage.`, by: rep },
    );
  }

  if (lead.stage === "move_in") {
    entries.push(
      { id: `${lead.id}-i12`, date: lead.lastContactDate, type: "meeting", title: "Move-in coordination meeting", description: `Finalized move-in details. Room prepared, care team assigned.`, by: rep },
      { id: `${lead.id}-i13`, date: lead.lastContactDate, type: "stage_change", title: "Moved to Move-in", description: `All paperwork complete. Move-in scheduled.`, by: rep },
    );
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const leadsRaw = [
  { id: "p1", name: "Margaret Chen", contactPerson: "Lisa Chen", contactRelation: "Daughter", contactPhone: "(213) 555-0142", contactEmail: "lisa.chen@email.com", careLevel: "Memory Care", lastContactDate: "2026-02-12", facility: "Sunrise Gardens", stage: "inquiry", source: "Website", inquiryDate: "2026-01-28", initialContact: "2026-01-29", nextActivity: "Follow-up call Feb 14", salesRep: "Alex Rivera", intakeNote: { leadSource: "Google search, 'Memory care near me'", zipcode: "90007", caller: "Lisa Chen (daughter)", dateTime: "Feb 12 — 10:42 AM", salesRep: "Alex Rivera", situationSummary: ["Daughter exploring options for mother after recent fall", "Currently living alone at home", "Doctor recommended considering memory care within 3–6 months", "No immediate move needed but 'starting research now'"], careNeeds: ["Early-stage memory concerns", "Needs help with meds + meals", "Mild mobility issues — uses walker", "Independent with bathing/dressing currently"], budgetFinancial: ["Budget range: $5,000–$7,000/month", "Paying private for now", "Sold house last year → has savings"], decisionMakers: ["Lisa (primary decision maker)", "Brother in Seattle will join later in process"], timeline: "Ideal move: Summer or sooner if health declines", preferences: ["Wants community with activities", "Social environment", "Outdoor space", "Strong preference for private room"], objections: ["Fear mother will resist moving", "Wants reassurance transition support is gentle"], salesRepAssessment: ["Warm lead", "High likelihood to tour", "Needs education + trust building"], nextStep: ["Scheduled tour for Feb 15 at 2 PM", "Sent brochure + pricing sheet via email"] } },
  { id: "p2", name: "Robert Williams", contactPerson: "Karen Williams", contactRelation: "Wife", contactPhone: "(213) 555-0198", contactEmail: "karen.williams@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-11", facility: "Oakwood Manor", stage: "inquiry", source: "Digital Ads", inquiryDate: "2026-02-01", initialContact: "2026-02-02", nextActivity: "Send brochure Feb 13", salesRep: "Sarah Johnson", intakeNote: { leadSource: "Facebook ad, 'Senior living options'", zipcode: "90015", caller: "Karen Williams (wife)", dateTime: "Feb 11 — 2:15 PM", salesRep: "Sarah Johnson", situationSummary: ["Wife looking for help as husband's mobility declined", "Currently at home with part-time aide", "Wants more social interaction for husband"], careNeeds: ["Needs assistance with walking and transfers", "Medication management required", "Meals and housekeeping needed", "Mostly independent cognitively"], budgetFinancial: ["Budget range: $4,000–$5,500/month", "VA benefits pending", "Retirement savings available"], decisionMakers: ["Karen (primary)", "Adult son consulted occasionally"], timeline: "Within 2–3 months ideally", preferences: ["Ground floor unit preferred", "Wants active social calendar", "Pet-friendly community"], objections: ["Worried husband will feel isolated", "Concerned about cost long-term"], salesRepAssessment: ["Moderate lead", "Needs VA benefits guidance", "Good fit for Oakwood"], nextStep: ["Send brochure and pricing", "Follow up in 2 days"] } },
  { id: "p3", name: "Dorothy Martinez", contactPerson: "Carlos Martinez", contactRelation: "Son", contactPhone: "(310) 555-0267", contactEmail: "carlos.martinez@email.com", careLevel: "Independent Living", lastContactDate: "2026-02-13", facility: "Lakeside Living", stage: "inquiry", source: "Referral", inquiryDate: "2026-02-05", initialContact: "2026-02-06", nextActivity: "Schedule tour Feb 15", salesRep: "Mike Peters", intakeNote: { leadSource: "Referral from Dr. Patel at Valley Medical", zipcode: "90024", caller: "Carlos Martinez (son)", dateTime: "Feb 13 — 9:30 AM", salesRep: "Mike Peters", situationSummary: ["Mother wants to downsize from large home", "Very active and social, just wants simpler living", "No major health concerns, proactive planning"], careNeeds: ["No daily care needed currently", "Wants access to dining options", "Light housekeeping preferred", "Wants fitness/wellness programs"], budgetFinancial: ["Budget: $3,500–$5,000/month", "Selling current home", "Pension + Social Security"], decisionMakers: ["Dorothy is primary decision maker", "Carlos helps with logistics"], timeline: "Flexible, aiming for spring move", preferences: ["Active community with events", "Near shopping and restaurants", "Wants a garden or patio space"], objections: ["Doesn't want to feel 'old'", "Wants to maintain independence"], salesRepAssessment: ["Strong lead", "Very motivated prospect", "Perfect IL candidate"], nextStep: ["Schedule tour for next week", "Send community newsletter"] } },
  { id: "p4", name: "Harold Foster", contactPerson: "Amy Foster", contactRelation: "Daughter", contactPhone: "(323) 555-0331", contactEmail: "amy.foster@email.com", careLevel: "Skilled Nursing", lastContactDate: "2026-02-10", facility: "Sunrise Gardens", stage: "inquiry", source: "Phone Call", inquiryDate: "2026-01-20", initialContact: "2026-01-20", nextActivity: "Needs assessment Feb 14", salesRep: "Emily Brown", intakeNote: { leadSource: "Direct phone call", zipcode: "90032", caller: "Amy Foster (daughter)", dateTime: "Feb 10 — 11:00 AM", salesRep: "Emily Brown", situationSummary: ["Father recovering from hip surgery", "Currently in rehab facility", "Needs long-term skilled nursing care", "Family overwhelmed with current situation"], careNeeds: ["24/7 skilled nursing required", "Physical therapy ongoing", "Wound care needed", "Diabetes management"], budgetFinancial: ["Medicare coverage for initial period", "Long-term care insurance active", "Budget: $7,000–$9,000/month"], decisionMakers: ["Amy (primary)", "Brother Mark co-decides"], timeline: "Urgent — within 2–4 weeks", preferences: ["Close to daughter's home", "Strong rehab program", "Private room essential"], objections: ["Worried about quality of care", "Previous bad experience at another facility"], salesRepAssessment: ["Hot lead — urgent timeline", "Needs immediate assessment", "High revenue potential"], nextStep: ["Schedule needs assessment ASAP", "Connect with clinical team"] } },
  { id: "p5", name: "Patricia Davis", contactPerson: "Tom Davis", contactRelation: "Son", contactPhone: "(213) 555-0455", contactEmail: "tom.davis@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-09", facility: "Oakwood Manor", stage: "connection", source: "Walk-in", inquiryDate: "2026-01-15", initialContact: "2026-01-15", nextActivity: "Second call Feb 13", salesRep: "Alex Rivera", intakeNote: { leadSource: "Walk-in visit to community", zipcode: "90019", caller: "Tom Davis (son)", dateTime: "Feb 9 — 3:00 PM", salesRep: "Alex Rivera", situationSummary: ["Son visited during lunch hour", "Mother living with him but needs more support", "Family dynamics making home care difficult"], careNeeds: ["Help with daily activities", "Medication reminders", "Social engagement needed", "Mild arthritis management"], budgetFinancial: ["Budget: $4,500–$6,000/month", "Mother's pension covers most", "Tom can supplement"], decisionMakers: ["Tom (primary)", "Sister in Chicago involved remotely"], timeline: "1–2 months", preferences: ["Warm, family-like atmosphere", "Good food program", "Transportation services"], objections: ["Mother doesn't want to leave neighborhood", "Worried about adjustment period"], salesRepAssessment: ["Good lead", "Son is motivated", "Need to win over mother"], nextStep: ["Second call to discuss options", "Invite for lunch visit with mother"] } },
  { id: "p6", name: "William Anderson", contactPerson: "Self", contactRelation: "", contactPhone: "(310) 555-0512", contactEmail: "w.anderson@email.com", careLevel: "Independent Living", lastContactDate: "2026-02-10", facility: "Lakeside Living", stage: "connection", source: "Website", inquiryDate: "2026-01-22", initialContact: "2026-01-23", nextActivity: "Email info packet Feb 14", salesRep: "Mike Peters", intakeNote: { leadSource: "Website contact form", zipcode: "90049", caller: "William Anderson (self)", dateTime: "Feb 10 — 1:30 PM", salesRep: "Mike Peters", situationSummary: ["Recently widowed, living alone in large house", "Wants community and social connections", "Very active — plays golf, volunteers"], careNeeds: ["No care needs currently", "Wants meal plan flexibility", "Fitness center access important", "Concierge-style services"], budgetFinancial: ["Budget: $4,000–$6,500/month", "Substantial savings from career", "House sale will fund move"], decisionMakers: ["William — sole decision maker", "Adult children supportive"], timeline: "3–6 months, no rush", preferences: ["Upscale community feel", "Golf or outdoor recreation nearby", "Fine dining options", "Dog-friendly"], objections: ["Doesn't want to feel 'institutionalized'", "Wants flexible meal plan"], salesRepAssessment: ["Premium prospect", "High budget potential", "Perfect for luxury IL"], nextStep: ["Send premium info packet", "Invite to community event"] } },
  { id: "p7", name: "Barbara Wilson", contactPerson: "Nancy Wilson", contactRelation: "Daughter", contactPhone: "(323) 555-0634", contactEmail: "nancy.wilson@email.com", careLevel: "Memory Care", lastContactDate: "2026-02-08", facility: "Sunrise Gardens", stage: "connection", source: "Referral", inquiryDate: "2026-01-18", initialContact: "2026-01-19", nextActivity: "Tour confirmation Feb 12", salesRep: "Sarah Johnson", intakeNote: { leadSource: "Referral from Alzheimer's Association", zipcode: "90034", caller: "Nancy Wilson (daughter)", dateTime: "Feb 8 — 10:15 AM", salesRep: "Sarah Johnson", situationSummary: ["Mother diagnosed with early Alzheimer's", "Currently at home with full-time caregiver", "Caregiver leaving in 2 months", "Family exhausted from caregiving"], careNeeds: ["Memory care programming needed", "Wandering prevention", "Structured daily routine", "Medication management", "Nutritional support"], budgetFinancial: ["Budget: $6,000–$8,000/month", "Long-term care insurance", "Family pooling resources"], decisionMakers: ["Nancy (primary)", "Two siblings involved"], timeline: "Within 2 months before caregiver leaves", preferences: ["Secure memory care unit", "Music therapy programs", "Garden walking paths", "Family visiting areas"], objections: ["Guilt about placing mother", "Wants to ensure dignity maintained"], salesRepAssessment: ["Strong lead with clear timeline", "Emotional support needed", "Good fit for our MC program"], nextStep: ["Confirm tour date", "Send memory care program details"] } },
  { id: "p8", name: "James Thompson", contactPerson: "Self", contactRelation: "", contactPhone: "(310) 555-0789", contactEmail: "j.thompson@email.com", careLevel: "Independent Living", lastContactDate: "2026-02-07", facility: "Oakwood Manor", stage: "pre_tour", source: "Digital Ads", inquiryDate: "2026-01-10", initialContact: "2026-01-11", nextActivity: "Tour Feb 14 10am", salesRep: "David Kim", intakeNote: { leadSource: "Google Ads, 'Independent senior living'", zipcode: "90025", caller: "James Thompson (self)", dateTime: "Feb 7 — 4:00 PM", salesRep: "David Kim", situationSummary: ["Retired professor looking for intellectual community", "Lives alone in condo, wants more engagement", "Very independent and active"], careNeeds: ["No care needs", "Wants intellectual programming", "Library and study space", "Walking/hiking group"], budgetFinancial: ["Budget: $3,800–$5,000/month", "University pension", "Investment income"], decisionMakers: ["James — sole decision maker"], timeline: "Spring or summer", preferences: ["Intellectual community", "Book clubs and lectures", "Quiet study areas", "Walking trails"], objections: ["Doesn't want rigid schedules", "Values privacy highly"], salesRepAssessment: ["Engaged prospect", "Will be community ambassador", "Needs to see intellectual programs"], nextStep: ["Tour scheduled Feb 14 at 10am", "Prepare program calendar to show"] } },
  { id: "p9", name: "Eleanor Foster", contactPerson: "John Foster", contactRelation: "Son", contactPhone: "(213) 555-0856", contactEmail: "john.foster@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-11", facility: "Sunrise Gardens", stage: "pre_tour", source: "Phone Call", inquiryDate: "2026-01-25", initialContact: "2026-01-25", nextActivity: "Tour Feb 15 2pm", salesRep: "Alex Rivera", intakeNote: { leadSource: "Phone call from hospital referral", zipcode: "90042", caller: "John Foster (son)", dateTime: "Feb 11 — 9:00 AM", salesRep: "Alex Rivera", situationSummary: ["Mother recently hospitalized for pneumonia", "Recovering but can't return to independent living", "Son lives nearby, wants mother close"], careNeeds: ["Daily living assistance needed", "Post-illness recovery support", "Regular health monitoring", "Physical therapy continuation"], budgetFinancial: ["Budget: $5,000–$6,500/month", "Mother's savings and SS", "John can contribute monthly"], decisionMakers: ["John (primary)", "Eleanor's input important"], timeline: "Within 3–4 weeks post-discharge", preferences: ["Near son's home", "Strong health services", "Comfortable recovery environment", "Good dining program"], objections: ["Eleanor worried about losing independence", "Cost concerns long-term"], salesRepAssessment: ["Hot lead", "Medical urgency drives timeline", "Good AL candidate"], nextStep: ["Tour Feb 15 at 2pm", "Prepare health services overview"] } },
  { id: "p10", name: "Richard Taylor", contactPerson: "Susan Taylor", contactRelation: "Wife", contactPhone: "(310) 555-0923", contactEmail: "susan.taylor@email.com", careLevel: "Memory Care", lastContactDate: "2026-02-12", facility: "Oakwood Manor", stage: "pre_tour", source: "Website", inquiryDate: "2026-01-30", initialContact: "2026-01-31", nextActivity: "Tour Feb 13 11am", salesRep: "Sarah Johnson", intakeNote: { leadSource: "Website inquiry after reading blog", zipcode: "90064", caller: "Susan Taylor (wife)", dateTime: "Feb 12 — 2:30 PM", salesRep: "Sarah Johnson", situationSummary: ["Husband diagnosed with moderate dementia", "Susan providing all care at home", "She's exhausted and needs support", "Doctor strongly recommends placement"], careNeeds: ["Full memory care needed", "Behavioral management", "24-hour supervision", "Activities for cognitive engagement"], budgetFinancial: ["Budget: $6,500–$8,500/month", "Long-term care insurance covers $5k/mo", "Joint savings available"], decisionMakers: ["Susan (sole decision maker)", "Children supportive"], timeline: "As soon as possible", preferences: ["Compassionate staff", "Couples visiting program", "Art and music therapy", "Secure outdoor area"], objections: ["Feels like she's abandoning husband", "Worried about quality of memory care"], salesRepAssessment: ["Very warm lead", "Caregiver burnout driving urgency", "Needs emotional support during process"], nextStep: ["Tour tomorrow at 11am", "Introduce to MC director"] } },
  { id: "p11", name: "Virginia Clark", contactPerson: "David Clark", contactRelation: "Son", contactPhone: "(323) 555-1045", contactEmail: "david.clark@email.com", careLevel: "Skilled Nursing", lastContactDate: "2026-02-06", facility: "Lakeside Living", stage: "post_tour", source: "Referral", inquiryDate: "2026-01-05", initialContact: "2026-01-06", nextActivity: "Follow-up meeting Feb 14", salesRep: "Emily Brown", intakeNote: { leadSource: "Referral from discharge planner at Cedar Sinai", zipcode: "90016", caller: "David Clark (son)", dateTime: "Feb 6 — 11:30 AM", salesRep: "Emily Brown", situationSummary: ["Mother post-stroke, needs skilled care", "Currently in hospital rehab unit", "Discharge planned within 2 weeks", "Complex medical needs"], careNeeds: ["Skilled nursing 24/7", "Speech therapy", "Occupational therapy", "Feeding assistance", "Catheter care"], budgetFinancial: ["Medicare Part A initially", "Medicaid application in process", "Budget: $8,000–$10,000/month without insurance"], decisionMakers: ["David (primary)", "Sister in Oregon co-decides"], timeline: "Urgent — 1–2 weeks", preferences: ["Strong therapy team", "Private or semi-private room", "Family-friendly visiting hours"], objections: ["Overwhelmed by process", "Medicaid uncertainty"], salesRepAssessment: ["Urgent placement need", "Complex but high-value", "Need to expedite assessment"], nextStep: ["Follow-up meeting Feb 14", "Coordinate with discharge planner"] }, tourNotes: [{ tourDate: "2026-01-28", attendees: "David Clark (alone)", tourGuide: "Emily Brown", summary: "David was quiet and overwhelmed. Impressed by therapy gym but had sticker shock at pricing. Asked about Medicare coverage. Needs sister's buy-in before deciding." }, { tourDate: "2026-02-04", attendees: "David Clark + sister (video call)", tourGuide: "Emily Brown", summary: "David much more relaxed on 2nd visit. Sister asked detailed staffing questions. Both felt this was the right place. Medicaid timeline is the main blocker. Probability ~75%." }] },
  { id: "p12", name: "George Lewis", contactPerson: "Mary Lewis", contactRelation: "Daughter", contactPhone: "(213) 555-1178", contactEmail: "mary.lewis@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-08", facility: "Sunrise Gardens", stage: "post_tour", source: "Walk-in", inquiryDate: "2026-01-12", initialContact: "2026-01-12", nextActivity: "Send pricing Feb 13", salesRep: "Mike Peters", intakeNote: { leadSource: "Walk-in with daughter during event", zipcode: "90028", caller: "Mary Lewis (daughter)", dateTime: "Feb 8 — 1:00 PM", salesRep: "Mike Peters", situationSummary: ["Father attended open house event", "Enjoyed the community atmosphere", "Daughter managing his finances", "Ready to move forward"], careNeeds: ["Light daily assistance", "Medication management", "Social programming", "Nutritional support — diabetic diet"], budgetFinancial: ["Budget: $4,500–$5,500/month", "Father's retirement + SS", "Property sale pending"], decisionMakers: ["Mary handles finances", "George wants input on room choice"], timeline: "After property sale, ~6 weeks", preferences: ["Room near dining hall", "Diabetic-friendly menu", "Activities and outings", "Close to daughter's work"], objections: ["Wants to wait for property sale", "George nervous about new people"], salesRepAssessment: ["Toured and liked community", "Waiting on finances", "Keep warm with follow-ups"], nextStep: ["Send detailed pricing options", "Offer room hold option"] }, tourNotes: [{ tourDate: "2026-01-25", attendees: "Mary Lewis (alone, scouting for father)", tourGuide: "Mike Peters", summary: "Mary visited alone to scope out facility. Took lots of photos. Impressed by dining and activities. Wants diabetic menu options. Father hasn't seen it yet." }, { tourDate: "2026-02-06", attendees: "George Lewis + Mary Lewis", tourGuide: "Mike Peters", summary: "George quiet at first but warmed up during lunch. Said 'This doesn't feel like a hospital.' Both liked courtyard and resident social atmosphere. Property sale is the only blocker. Probability ~70%." }] },
  { id: "p13", name: "Helen Moore", contactPerson: "Paul Moore", contactRelation: "Husband", contactPhone: "(310) 555-1234", contactEmail: "paul.moore@email.com", careLevel: "Memory Care", lastContactDate: "2026-02-09", facility: "Oakwood Manor", stage: "post_tour", source: "Digital Ads", inquiryDate: "2026-01-08", initialContact: "2026-01-09", nextActivity: "Family meeting Feb 16", salesRep: "David Kim", intakeNote: { leadSource: "Facebook ad, 'Memory care for loved ones'", zipcode: "90045", caller: "Paul Moore (husband)", dateTime: "Feb 9 — 10:00 AM", salesRep: "David Kim", situationSummary: ["Wife has moderate Alzheimer's", "Paul has been sole caregiver for 3 years", "His own health declining from stress", "Children live out of state"], careNeeds: ["Full memory care", "Sundowning management", "Structured activities", "Medication management", "Personal care assistance"], budgetFinancial: ["Budget: $7,000–$9,000/month", "Long-term care insurance", "Retirement savings substantial"], decisionMakers: ["Paul (primary)", "Daughter flying in for decision", "Son joins by video call"], timeline: "Within 1 month", preferences: ["Beautiful outdoor spaces", "Art therapy program", "Spouse visiting suite available", "Gentle, patient staff"], objections: ["Paul feels guilty", "Wants daily visiting access", "Worried about wife's reaction"], salesRepAssessment: ["Toured and was emotional but positive", "Family meeting will seal it", "Need to show spouse support services"], nextStep: ["Family meeting Feb 16", "Prepare spouse transition guide"] }, tourNotes: [{ tourDate: "2026-01-22", attendees: "Paul Moore (alone)", tourGuide: "David Kim", summary: "Paul was emotional and overwhelmed. Broke down describing Helen's condition. Liked the garden and art therapy room. Not ready to decide — needs to process and talk to children." }, { tourDate: "2026-02-03", attendees: "Paul Moore (alone, 2nd visit)", tourGuide: "David Kim", summary: "Noticeably calmer. Had prepared questions. Daughter supports placement. Loved art therapy and spouse visiting suite. Wants daughter to see facility before committing. Probability improving." }, { tourDate: "2026-02-07", attendees: "Paul Moore + daughter (flew in)", tourGuide: "David Kim", summary: "Paul introduced daughter to staff by name. Daughter said 'Dad, this is the right choice.' Both spent time in memory garden. Ready to move forward — family meeting scheduled Feb 16 to finalize. Probability ~80%." }] },
  { id: "p14", name: "Frank White", contactPerson: "Jenny White", contactRelation: "Daughter", contactPhone: "(310) 555-1367", contactEmail: "jenny.white@email.com", careLevel: "Independent Living", lastContactDate: "2026-02-05", facility: "Lakeside Living", stage: "deposit", source: "Website", inquiryDate: "2025-12-20", initialContact: "2025-12-21", nextActivity: "Deposit paperwork Feb 14", salesRep: "Alex Rivera", intakeNote: { leadSource: "Website research, compared 5 communities", zipcode: "90066", caller: "Jenny White (daughter)", dateTime: "Feb 5 — 3:30 PM", salesRep: "Alex Rivera", situationSummary: ["Father very ready to move", "Has visited multiple communities", "Chose Lakeside for its location and amenities", "Wants to move before spring"], careNeeds: ["No daily care needed", "Wants wellness programs", "Pool and fitness access", "Social dining"], budgetFinancial: ["Budget: $4,000–$5,500/month", "Pension + investments", "Daughter helps with paperwork"], decisionMakers: ["Frank with Jenny's support"], timeline: "Move in by March", preferences: ["Lake view if possible", "Near walking trails", "Good restaurant-style dining", "Active social calendar"], objections: ["Wants to negotiate price", "Concerned about pet policy for cat"], salesRepAssessment: ["Ready to commit", "Deposit conversation today", "Minor objections to address"], nextStep: ["Complete deposit paperwork Feb 14", "Address pet policy questions"] } },
  { id: "p15", name: "Ruth Harris", contactPerson: "Mike Harris", contactRelation: "Son", contactPhone: "(213) 555-1456", contactEmail: "mike.harris@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-10", facility: "Sunrise Gardens", stage: "deposit", source: "Phone Call", inquiryDate: "2025-12-15", initialContact: "2025-12-15", nextActivity: "Room selection Feb 15", salesRep: "Sarah Johnson", intakeNote: { leadSource: "Phone call referral from friend", zipcode: "90020", caller: "Mike Harris (son)", dateTime: "Feb 10 — 10:45 AM", salesRep: "Sarah Johnson", situationSummary: ["Mother excited to join friend already living here", "Has toured twice and loved it", "Ready to put down deposit", "Friend is great advocate"], careNeeds: ["Light assistance with mobility", "Medication reminders", "Social engagement — friend already here", "Dietary management"], budgetFinancial: ["Budget: $5,000–$6,000/month", "Mother's savings", "Son supplements $500/mo"], decisionMakers: ["Ruth (very involved)", "Mike handles finances"], timeline: "Room ready by March 1", preferences: ["Room near friend if possible", "Ground floor", "Garden access", "Group activities"], objections: ["Wants specific room near friend", "Slight concern about dining quality"], salesRepAssessment: ["Deposit ready", "Friend referral is golden", "Lock in room near friend"], nextStep: ["Room selection meeting Feb 15", "Prepare room options near friend's unit"] }, tourNotes: [{ tourDate: "2026-01-10", attendees: "Ruth Harris + friend Edna (current resident)", tourGuide: "Sarah Johnson", summary: "Ruth lit up seeing Edna thriving. Loved the garden, book club, and dining atmosphere. Already picturing herself living here. Wants room near Edna. Son needs to visit for financial buy-in." }, { tourDate: "2026-01-28", attendees: "Ruth Harris + Mike Harris (son)", tourGuide: "Sarah Johnson", summary: "Mike impressed by cleanliness and staff. Ruth greeted staff by name. Mike said 'Mom, I haven't seen you this excited in months.' Both ready to proceed — deposit conversation initiated. Probability ~95%." }] },
  { id: "p16", name: "Thomas Martin", contactPerson: "Laura Martin", contactRelation: "Wife", contactPhone: "(323) 555-1578", contactEmail: "laura.martin@email.com", careLevel: "Skilled Nursing", lastContactDate: "2026-02-04", facility: "Oakwood Manor", stage: "move_in", source: "Referral", inquiryDate: "2025-11-20", initialContact: "2025-11-21", nextActivity: "Move-in day Feb 17", salesRep: "Emily Brown", intakeNote: { leadSource: "Referral from neurologist Dr. Kim", zipcode: "90038", caller: "Laura Martin (wife)", dateTime: "Feb 4 — 2:00 PM", salesRep: "Emily Brown", situationSummary: ["Husband has advanced Parkinson's disease", "Home care no longer sufficient", "All paperwork completed", "Move-in scheduled"], careNeeds: ["24/7 skilled nursing", "Parkinson's-specific care protocol", "Physical and occupational therapy", "Fall prevention program", "Specialized nutrition"], budgetFinancial: ["Insurance covers 70%", "Supplemental from savings", "Budget managed: ~$9,000/month total"], decisionMakers: ["Laura (sole decision maker)"], timeline: "Move-in Feb 17", preferences: ["Experienced Parkinson's caregivers", "Adaptive equipment in room", "Easy spouse visiting", "Therapy gym access"], objections: ["None remaining — fully committed", "Slight anxiety about transition day"], salesRepAssessment: ["Completed sale", "Ensure smooth move-in experience", "Potential for referrals from Dr. Kim"], nextStep: ["Move-in day Feb 17", "Welcome orientation prepared", "Assign primary care team"] } },
  { id: "p17", name: "Betty Jackson", contactPerson: "Sarah Jackson", contactRelation: "Granddaughter", contactPhone: "(213) 555-1690", contactEmail: "sarah.jackson@email.com", careLevel: "Memory Care", lastContactDate: "2026-02-13", facility: "Sunrise Gardens", stage: "inquiry", source: "Digital Ads", inquiryDate: "2026-02-10", initialContact: "2026-02-11", nextActivity: "Intro call Feb 14", salesRep: "David Kim", intakeNote: { leadSource: "Instagram ad, 'Memory care with heart'", zipcode: "90004", caller: "Sarah Jackson (granddaughter)", dateTime: "Feb 13 — 11:15 AM", salesRep: "David Kim", situationSummary: ["Granddaughter primary caregiver for grandmother", "Betty has moderate dementia", "Currently in adult day program", "Granddaughter can't continue full-time caregiving"], careNeeds: ["Memory care program", "Engaging daily activities", "Personal care assistance", "Nutritional monitoring", "Social interaction"], budgetFinancial: ["Budget: $5,500–$7,000/month", "Grandmother's savings and SS", "Family contributing"], decisionMakers: ["Sarah (primary)", "Mother overseas, involved by phone"], timeline: "Within 2 months", preferences: ["Warm, home-like environment", "Intergenerational activities", "Music and art programs", "Good outdoor spaces"], objections: ["Worried grandmother will be confused by move", "Wants to visit daily initially"], salesRepAssessment: ["Good lead", "Emotional but motivated", "Young caregiver — needs extra support"], nextStep: ["Intro call Feb 14", "Send virtual tour video"] } },
  { id: "p18", name: "Charles Robinson", contactPerson: "Self", contactRelation: "", contactPhone: "(310) 555-1745", contactEmail: "c.robinson@email.com", careLevel: "Independent Living", lastContactDate: "2026-02-11", facility: "Lakeside Living", stage: "connection", source: "Walk-in", inquiryDate: "2026-01-28", initialContact: "2026-01-28", nextActivity: "Virtual tour Feb 13", salesRep: "Mike Peters", intakeNote: { leadSource: "Drove by and walked in", zipcode: "90077", caller: "Charles Robinson (self)", dateTime: "Feb 11 — 12:00 PM", salesRep: "Mike Peters", situationSummary: ["Recently retired executive", "Downsizing from large estate", "Wants maintenance-free luxury living", "Very particular about quality"], careNeeds: ["No care needs", "Wants concierge services", "Fine dining important", "Fitness and wellness programs"], budgetFinancial: ["Budget: $6,000–$9,000/month", "Very comfortable financially", "Looking for value, not cheapest option"], decisionMakers: ["Charles — sole decision maker"], timeline: "4–6 months, waiting for estate sale", preferences: ["Premium finishes and furnishings", "Wine club or tasting events", "Cultural outings", "Executive-level privacy"], objections: ["Wants to see comparable options first", "Particular about noise levels"], salesRepAssessment: ["High-value prospect", "Luxury expectations", "Need to impress on tour"], nextStep: ["Virtual tour walkthrough Feb 13", "Schedule in-person VIP tour after"] } },
  { id: "p19", name: "Marie Garcia", contactPerson: "Rosa Garcia", contactRelation: "Daughter", contactPhone: "(323) 555-1823", contactEmail: "rosa.garcia@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-07", facility: "Oakwood Manor", stage: "pre_tour", source: "Referral", inquiryDate: "2026-01-15", initialContact: "2026-01-16", nextActivity: "Tour Feb 14 3pm", salesRep: "Emily Brown", intakeNote: { leadSource: "Referral from parish priest Father Rodriguez", zipcode: "90033", caller: "Rosa Garcia (daughter)", dateTime: "Feb 7 — 9:45 AM", salesRep: "Emily Brown", situationSummary: ["Mother's health declining after spouse's death", "Not eating well, losing weight", "Daughter works full-time, can't provide enough care", "Church community recommended our facility"], careNeeds: ["Meal preparation and nutrition monitoring", "Grief counseling support", "Light daily care", "Social engagement critical", "Medication management"], budgetFinancial: ["Budget: $4,000–$5,000/month", "Mother's SS and small pension", "Daughter supplements", "Looking into Medicaid"], decisionMakers: ["Rosa (primary)", "Brother helps with finances"], timeline: "Within 6 weeks", preferences: ["Spanish-speaking staff", "Chapel or spiritual services", "Home-cooked meal style", "Warm community feel"], objections: ["Language barrier concern", "Mother has never lived away from family"], salesRepAssessment: ["Good lead", "Cultural sensitivity important", "Connect with bilingual staff for tour"], nextStep: ["Tour Feb 14 at 3pm with bilingual guide", "Share menu and spiritual services info"] } },
  { id: "p21", name: "Evelyn Parker", contactPerson: "Diana Parker", contactRelation: "Daughter", contactPhone: "(310) 555-2034", contactEmail: "diana.parker@email.com", careLevel: "Independent Living", lastContactDate: "2026-02-12", facility: "Lakeside Living", stage: "inquiry", source: "Event", inquiryDate: "2026-02-08", initialContact: "2026-02-09", nextActivity: "Follow-up call Feb 15", salesRep: "Sarah Johnson", intakeNote: { leadSource: "Senior Living Expo at LA Convention Center", zipcode: "90036", caller: "Diana Parker (daughter)", dateTime: "Feb 12 — 3:15 PM", salesRep: "Sarah Johnson", situationSummary: ["Attended Senior Living Expo booth with daughter", "Mother interested in active community lifestyle", "Currently living alone in apartment", "Lease ending in 3 months"], careNeeds: ["No daily care needed", "Wants fitness and wellness programs", "Social dining preferred", "Transportation to appointments"], budgetFinancial: ["Budget: $3,500–$5,000/month", "Mother's pension and SS", "Apartment lease ending soon"], decisionMakers: ["Evelyn (primary)", "Diana helps with research"], timeline: "Within 3 months when lease ends", preferences: ["Active social calendar", "Fitness center and pool", "Pet-friendly for small cat", "Near daughter's home"], objections: ["Wants to compare several communities first", "Not sure about giving up apartment"], salesRepAssessment: ["Good lead from expo", "Motivated by lease timeline", "Needs follow-up to build relationship"], nextStep: ["Follow-up call Feb 15", "Send community comparison guide"] } },
  { id: "p22", name: "Arthur Mitchell", contactPerson: "Self", contactRelation: "", contactPhone: "(323) 555-2156", contactEmail: "a.mitchell@email.com", careLevel: "Assisted Living", lastContactDate: "2026-02-10", facility: "Oakwood Manor", stage: "connection", source: "Event", inquiryDate: "2026-02-03", initialContact: "2026-02-04", nextActivity: "Tour Feb 16 11am", salesRep: "David Kim", intakeNote: { leadSource: "Community open house event", zipcode: "90048", caller: "Arthur Mitchell (self)", dateTime: "Feb 10 — 11:00 AM", salesRep: "David Kim", situationSummary: ["Attended community open house with neighbor", "Retired engineer, health declining slightly", "Wife passed 2 years ago, needs more daily support", "Impressed by staff during event"], careNeeds: ["Light daily assistance", "Medication management", "Social engagement", "Meal preparation"], budgetFinancial: ["Budget: $5,000–$6,500/month", "Strong retirement portfolio", "Home equity available"], decisionMakers: ["Arthur (primary)", "Daughter supportive"], timeline: "Spring move preferred", preferences: ["Warm community atmosphere", "Good food program", "Workshop or hobby spaces", "Outdoor walking areas"], objections: ["Wants to see facility in person first", "Concerned about losing independence"], salesRepAssessment: ["Good lead from open house", "Motivated prospect", "Tour should move him forward"], nextStep: ["Tour scheduled Feb 16 at 11am", "Prepare activity calendar to show"] } },
  { id: "p20", name: "Donald Brown", contactPerson: "Kevin Brown", contactRelation: "Son", contactPhone: "(213) 555-1967", contactEmail: "kevin.brown@email.com", careLevel: "Skilled Nursing", lastContactDate: "2026-02-03", facility: "Sunrise Gardens", stage: "move_in", source: "Phone Call", inquiryDate: "2025-11-10", initialContact: "2025-11-10", nextActivity: "Move-in day Feb 20", salesRep: "Alex Rivera", intakeNote: { leadSource: "Direct phone call from hospital social worker", zipcode: "90026", caller: "Kevin Brown (son)", dateTime: "Feb 3 — 4:30 PM", salesRep: "Alex Rivera", situationSummary: ["Father has COPD and heart failure", "Multiple hospitalizations last year", "Needs continuous medical oversight", "All paperwork finalized"], careNeeds: ["24/7 skilled nursing", "Respiratory therapy", "Cardiac monitoring", "Wound care", "Complex medication regimen"], budgetFinancial: ["Medicare + supplemental insurance", "VA benefits approved", "Budget managed at ~$8,500/month"], decisionMakers: ["Kevin (sole)", "Father's POA"], timeline: "Move-in Feb 20", preferences: ["Experienced pulmonary care team", "Oxygen therapy setup", "Comfortable private room", "Good visiting room for family"], objections: ["None — fully committed", "Wants smooth transition from hospital"], salesRepAssessment: ["Completed sale", "Complex medical — ensure clinical readiness", "VA coordination needed"], nextStep: ["Move-in day Feb 20", "Clinical team briefing scheduled", "Room prepared with medical equipment"] } },
];

const personalInfo = {
  p1: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Mar 15" }, { type: "Death Anniversary (Husband)", date: "Sep 22" }], mustKnow: "Daughter Lisa based on east coast — preferred text before call. Mother gets anxious with strangers, introduce slowly." },
  p2: { maritalStatus: "Married", specialDates: [{ type: "Birthday", date: "Jul 4" }, { type: "Wedding Anniversary", date: "Jun 18" }], mustKnow: "Wife Karen is hard of hearing — speak clearly and face her. Husband Robert is a veteran, mention VA benefits early." },
  p3: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Nov 2" }, { type: "Death Anniversary (Husband)", date: "Apr 10" }], mustKnow: "Very independent, do NOT use the word 'facility' — say 'community'. Son Carlos only available after 5 PM." },
  p4: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Jan 30" }], mustKnow: "Daughter Amy works night shifts, best to call before noon. Father had a bad experience at previous facility — be sensitive about care quality." },
  p5: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "May 8" }, { type: "Death Anniversary (Husband)", date: "Dec 1" }], mustKnow: "Mother Patricia is reluctant to move — let her lead conversations. Sister in Chicago calls every Sunday, loop her in." },
  p6: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Aug 19" }, { type: "Death Anniversary (Wife)", date: "Oct 3" }], mustKnow: "Recently lost wife, still grieving. Avoid mentioning couples programs. Has a golden retriever named Max — confirm pet policy." },
  p7: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Feb 28" }, { type: "Death Anniversary (Husband)", date: "Jul 15" }], mustKnow: "Mother wanders at night — safety is #1 priority. Daughter Nancy is a nurse, will ask detailed clinical questions." },
  p8: { maritalStatus: "Single", specialDates: [{ type: "Birthday", date: "Dec 12" }], mustKnow: "Retired professor, values intellectual conversation. Do not rush him — he researches thoroughly before deciding." },
  p9: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Apr 22" }, { type: "Death Anniversary (Husband)", date: "Nov 5" }], mustKnow: "Son John is very protective — always CC him on emails. Mother Eleanor prefers morning appointments only." },
  p10: { maritalStatus: "Married", specialDates: [{ type: "Birthday (Richard)", date: "Jun 7" }, { type: "Wedding Anniversary", date: "Sep 14" }, { type: "Birthday (Susan)", date: "Mar 20" }], mustKnow: "Susan is emotionally fragile — be gentle, no pressure. Richard responds well to music, mention music therapy early." },
  p11: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Oct 16" }], mustKnow: "Son David is overwhelmed — keep communications simple and clear. Sister in Oregon prefers email only, no phone calls." },
  p12: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Sep 3" }, { type: "Death Anniversary (Wife)", date: "Jan 20" }], mustKnow: "George is diabetic — always highlight dietary accommodations. Daughter Mary makes all financial decisions, address pricing to her." },
  p13: { maritalStatus: "Married", specialDates: [{ type: "Birthday (Helen)", date: "May 14" }, { type: "Wedding Anniversary", date: "Aug 6" }, { type: "Birthday (Paul)", date: "Jan 11" }], mustKnow: "Paul visits daily — ensure open visiting policy is highlighted. Helen loves painting, mention art therapy program first." },
  p14: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Mar 29" }, { type: "Death Anniversary (Wife)", date: "May 2" }], mustKnow: "Frank has a cat named Whiskers — pet policy is a dealbreaker. Daughter Jenny handles all paperwork, Frank decides on lifestyle." },
  p15: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Jul 22" }], mustKnow: "Best friend Edna already lives here — room proximity is critical. Son Mike prefers weekend meetings only." },
  p16: { maritalStatus: "Married", specialDates: [{ type: "Birthday (Thomas)", date: "Nov 25" }, { type: "Wedding Anniversary", date: "Feb 14" }], mustKnow: "Wife Laura is anxious about transition day — provide detailed move-in schedule in advance. Thomas responds to calm male voices." },
  p17: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Aug 9" }, { type: "Death Anniversary (Husband)", date: "Mar 3" }], mustKnow: "Granddaughter Sarah is young caregiver (age 26) — be supportive, not condescending. Mother overseas in Philippines, 15-hour time difference." },
  p18: { maritalStatus: "Single", specialDates: [{ type: "Birthday", date: "Apr 1" }], mustKnow: "High-net-worth individual, expects VIP treatment. Do not discuss shared spaces — emphasize private and exclusive amenities." },
  p19: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Dec 24" }, { type: "Death Anniversary (Husband)", date: "Jun 30" }], mustKnow: "Spanish is primary language — always have bilingual staff available. Daughter Rosa is very religious, mention chapel services." },
  p20: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Feb 6" }, { type: "Death Anniversary (Wife)", date: "Aug 18" }], mustKnow: "Father is a veteran — always acknowledge service. Son Kevin has POA, all legal docs go through him." },
  p21: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Oct 30" }, { type: "Death Anniversary (Husband)", date: "May 15" }], mustKnow: "Daughter Diana lives 45 min away, prefers video calls over in-person. Evelyn has a small cat — confirm pet policy before tour." },
  p22: { maritalStatus: "Widow", specialDates: [{ type: "Birthday", date: "Jun 21" }, { type: "Death Anniversary (Wife)", date: "Jan 8" }], mustKnow: "Arthur is an engineer — he responds to data and facts, not emotions. Prefers email communication over phone calls." },
};

function deriveScore(lead) {
  const stage = lead.stage;
  const assessment = (lead.intakeNote?.salesRepAssessment || []).join(" ").toLowerCase();
  if (stage === "deposit" || stage === "move_in") return "hot";
  if (stage === "post_tour") return "warm";
  if (assessment.includes("hot") || assessment.includes("urgent")) return "hot";
  if (assessment.includes("strong") || assessment.includes("warm") || assessment.includes("very motivated")) return "warm";
  if (assessment.includes("moderate") || assessment.includes("good")) return "nurture";
  return "cold";
}

export const mockPipelineLeads = leadsRaw.map((l) => {
  const tourNotes = l.tourNotes || [];
  return {
    ...l,
    tourNotes,
    score: deriveScore(l),
    interactions: generateInteractions({ ...l, tourNotes }),
    callTranscripts: generateCallTranscripts({ ...l, tourNotes }),
    ...(personalInfo[l.id] || {}),
  };
});

// Generate calendar events for the week of Feb 9-13, 2026
export const mockCalendarTours = [
  // Monday Feb 9
  { id: "ct1", type: "tour", leadName: "Margaret Chen", facility: "Sunrise Gardens", date: "2026-02-09", startHour: 9, salesperson: "Sarah Johnson", salespersonColor: salespeople[0].color },
  { id: "ct2", type: "tour", leadName: "Robert Williams", facility: "Oakwood Manor", date: "2026-02-09", startHour: 11, salesperson: "Mike Peters", salespersonColor: salespeople[1].color },
  { id: "ct3", type: "tour", leadName: "Dorothy Martinez", facility: "Lakeside Living", date: "2026-02-09", startHour: 14, salesperson: "Emily Brown", salespersonColor: salespeople[2].color },
  { id: "ct4", type: "tour", leadName: "Harold Foster", facility: "Sunrise Gardens", date: "2026-02-09", startHour: 10, salesperson: "David Kim", salespersonColor: salespeople[3].color },
  // Tuesday Feb 10
  { id: "ct5", type: "tour", leadName: "Patricia Davis", facility: "Oakwood Manor", date: "2026-02-10", startHour: 9, salesperson: "Sarah Johnson", salespersonColor: salespeople[0].color },
  { id: "ct6", type: "tour", leadName: "William Anderson", facility: "Lakeside Living", date: "2026-02-10", startHour: 13, salesperson: "Mike Peters", salespersonColor: salespeople[1].color },
  { id: "ct7", type: "tour", leadName: "Barbara Wilson", facility: "Sunrise Gardens", date: "2026-02-10", startHour: 15, salesperson: "Emily Brown", salespersonColor: salespeople[2].color },
  { id: "ct8", type: "tour", leadName: "James Thompson", facility: "Oakwood Manor", date: "2026-02-10", startHour: 11, salesperson: "David Kim", salespersonColor: salespeople[3].color },
  // Wednesday Feb 11
  { id: "ct9", type: "tour", leadName: "Eleanor Foster", facility: "Sunrise Gardens", date: "2026-02-11", startHour: 10, salesperson: "Sarah Johnson", salespersonColor: salespeople[0].color },
  { id: "ct10", type: "tour", leadName: "Richard Taylor", facility: "Oakwood Manor", date: "2026-02-11", startHour: 14, salesperson: "Mike Peters", salespersonColor: salespeople[1].color },
  { id: "ct11", type: "tour", leadName: "Virginia Clark", facility: "Lakeside Living", date: "2026-02-11", startHour: 9, salesperson: "Emily Brown", salespersonColor: salespeople[2].color },
  { id: "ct12", type: "tour", leadName: "George Lewis", facility: "Sunrise Gardens", date: "2026-02-11", startHour: 16, salesperson: "David Kim", salespersonColor: salespeople[3].color },
  // Thursday Feb 12 — tours + community event
  { id: "ct13", type: "tour", leadName: "Helen Moore", facility: "Oakwood Manor", date: "2026-02-12", startHour: 9, salesperson: "Sarah Johnson", salespersonColor: salespeople[0].color },
  { id: "ct14", type: "tour", leadName: "Frank White", facility: "Lakeside Living", date: "2026-02-12", startHour: 11, salesperson: "Mike Peters", salespersonColor: salespeople[1].color },
  { id: "ct15", type: "tour", leadName: "Ruth Harris", facility: "Sunrise Gardens", date: "2026-02-12", startHour: 13, salesperson: "Emily Brown", salespersonColor: salespeople[2].color },
  { id: "ct16", type: "tour", leadName: "Thomas Martin", facility: "Oakwood Manor", date: "2026-02-12", startHour: 15, salesperson: "David Kim", salespersonColor: salespeople[3].color },
  { id: "ce1", type: "community", leadName: "Wellness Wednesday Luncheon", facility: "Sunrise Gardens", date: "2026-02-12", startHour: 12, salesperson: "Emily Brown", salespersonColor: "hsl(160, 60%, 45%)" },
  // Friday Feb 13
  { id: "ct17", type: "tour", leadName: "Betty Jackson", facility: "Sunrise Gardens", date: "2026-02-13", startHour: 10, salesperson: "Sarah Johnson", salespersonColor: salespeople[0].color },
  { id: "ct18", type: "tour", leadName: "Charles Robinson", facility: "Lakeside Living", date: "2026-02-13", startHour: 14, salesperson: "Mike Peters", salespersonColor: salespeople[1].color },
  { id: "ct19", type: "tour", leadName: "Marie Garcia", facility: "Oakwood Manor", date: "2026-02-13", startHour: 9, salesperson: "Emily Brown", salespersonColor: salespeople[2].color },
  { id: "ct20", type: "tour", leadName: "Donald Brown", facility: "Sunrise Gardens", date: "2026-02-13", startHour: 11, salesperson: "David Kim", salespersonColor: salespeople[3].color },
  // More spread across next week for month view
  { id: "ct21", type: "tour", leadName: "Margaret Chen", facility: "Sunrise Gardens", date: "2026-02-16", startHour: 10, salesperson: "Sarah Johnson", salespersonColor: salespeople[0].color },
  { id: "ct22", type: "tour", leadName: "Robert Williams", facility: "Oakwood Manor", date: "2026-02-17", startHour: 14, salesperson: "Mike Peters", salespersonColor: salespeople[1].color },
  { id: "ct23", type: "tour", leadName: "Dorothy Martinez", facility: "Lakeside Living", date: "2026-02-18", startHour: 11, salesperson: "Emily Brown", salespersonColor: salespeople[2].color },
  { id: "ct24", type: "tour", leadName: "Harold Foster", facility: "Sunrise Gardens", date: "2026-02-19", startHour: 9, salesperson: "David Kim", salespersonColor: salespeople[3].color },
  // Community Events — every Thursday at noon for 4 weeks
  { id: "ce2", type: "community", leadName: "Open House & Garden Tour", facility: "Lakeside Living", date: "2026-02-19", startHour: 12, salesperson: "Sarah Johnson", salespersonColor: "hsl(160, 60%, 45%)" },
  { id: "ce3", type: "community", leadName: "Family Info Session", facility: "Oakwood Manor", date: "2026-02-26", startHour: 12, salesperson: "Mike Peters", salespersonColor: "hsl(160, 60%, 45%)" },
  { id: "ce4", type: "community", leadName: "Senior Living Q&A Lunch", facility: "Sunrise Gardens", date: "2026-03-05", startHour: 12, salesperson: "David Kim", salespersonColor: "hsl(160, 60%, 45%)" },
];

export const mockMetrics = [
  { label: "Active Leads", value: 24, change: 12, changeLabel: "vs last month" },
  { label: "Tours This Week", value: 8, change: -5, changeLabel: "vs last week" },
  { label: "Occupancy Rate", value: 87, suffix: "%", change: 3, changeLabel: "vs last month" },
  { label: "Move-ins (MTD)", value: 5, change: 25, changeLabel: "vs last month" },
];

export const mockActivities = [
  { id: "a1", type: "lead", description: "New lead Margaret Chen added", user: "System", timestamp: "10 min ago" },
  { id: "a2", type: "tour", description: "Tour scheduled for Patricia Davis", user: "Sarah Johnson", timestamp: "1 hour ago" },
  { id: "a3", type: "note", description: "Note added to Robert Williams", user: "Mike Peters", timestamp: "2 hours ago" },
  { id: "a4", type: "status", description: "James Thompson moved to Applied", user: "Emily Brown", timestamp: "3 hours ago" },
  { id: "a5", type: "move_in", description: "Barbara Wilson completed move-in", user: "Sarah Johnson", timestamp: "Yesterday" },
  { id: "a6", type: "lead", description: "New lead Dorothy Martinez from referral", user: "System", timestamp: "Yesterday" },
];

/**
 * @typedef {Object} Referrer
 * @property {string} id
 * @property {string} name
 * @property {string} organization
 * @property {"Hospital"|"Physician"|"Social Worker"|"Local Communities"|"Insurance"|"Home Health"} type
 * @property {string} email
 * @property {string} phone
 * @property {string} contactPerson
 * @property {string[]} referredLeadIds
 * @property {number} serviceHoursRequested
 * @property {number} commissionRate
 * @property {number} totalCommission
 * @property {"hot"|"warm"|"cold"|"nurture"} score
 * @property {"active"|"inactive"} status
 * @property {string} lastReferralDate
 * @property {string} notes
 */

/** @type {Referrer[]} */
export const mockReferrers = [
  { id: "ref1", name: "Valley Medical Center", organization: "Valley Medical Group", type: "Hospital", email: "referrals@valleymed.com", phone: "(310) 555-8000", contactPerson: "Dr. Patel", contacts: [{ name: "Dr. Patel", role: "Primary Care Physician", phone: "(310) 555-8001", email: "patel@valleymed.com" }, { name: "Sarah Lin", role: "Social Worker", phone: "(310) 555-8002", email: "slin@valleymed.com" }, { name: "James Reyes", role: "Discharge Coordinator", phone: "(310) 555-8003", email: "jreyes@valleymed.com" }], referredLeadIds: ["p3", "p1", "p5"], serviceHoursRequested: 320, commissionRate: 8, totalCommission: 2880, score: "hot", status: "active", lastReferralDate: "2026-02-05", notes: "Long-standing partnership. Dr. Patel refers IL candidates." },
  { id: "ref2", name: "Alzheimer's Association LA", organization: "Alzheimer's Association", type: "Social Worker", email: "la@alz.org", phone: "(213) 555-9100", contactPerson: "Maria Torres", contacts: [{ name: "Maria Torres", role: "Lead Social Worker", phone: "(213) 555-9101", email: "mtorres@alz.org" }, { name: "Angela Wu", role: "Family Support Specialist", phone: "(213) 555-9102", email: "awu@alz.org" }], referredLeadIds: ["p7", "p9", "p2"], serviceHoursRequested: 540, commissionRate: 6, totalCommission: 3456, score: "warm", status: "active", lastReferralDate: "2026-01-18", notes: "Strong MC referral pipeline. Monthly meetings scheduled." },
  { id: "ref3", name: "Cedar Sinai Discharge Planning", organization: "Cedars-Sinai Medical Center", type: "Hospital", email: "discharge@cedars.org", phone: "(310) 555-7200", contactPerson: "Linda Park, RN", contacts: [{ name: "Linda Park, RN", role: "Discharge Planner", phone: "(310) 555-7201", email: "lpark@cedars.org" }, { name: "Dr. Robert Chen", role: "Attending Physician", phone: "(310) 555-7202", email: "rchen@cedars.org" }, { name: "Patricia Gomez", role: "Case Manager", phone: "(310) 555-7203", email: "pgomez@cedars.org" }], referredLeadIds: ["p11", "p4", "p8"], serviceHoursRequested: 720, commissionRate: 10, totalCommission: 9600, score: "hot", status: "active", lastReferralDate: "2026-01-05", notes: "High-acuity referrals. Skilled nursing focus." },
  { id: "ref4", name: "Dr. Kim Neurology", organization: "Kim Neurology Associates", type: "Physician", email: "office@kimneurology.com", phone: "(323) 555-4500", contactPerson: "Dr. James Kim", referredLeadIds: ["p16", "p6", "p10"], serviceHoursRequested: 480, commissionRate: 7, totalCommission: 5040, score: "warm", status: "active", lastReferralDate: "2025-11-20", notes: "Parkinson's and dementia specialist. 3 referrals in 12 months." },
  { id: "ref5", name: "St. Mary's Parish", organization: "Archdiocese of Los Angeles", type: "Local Communities", email: "frodriguez@stmarys.org", phone: "(323) 555-3300", contactPerson: "Father Rodriguez", referredLeadIds: ["p19", "p12"], serviceHoursRequested: 280, commissionRate: 5, totalCommission: 1600, score: "nurture", status: "active", lastReferralDate: "2026-01-15", notes: "Community outreach partner. Spanish-speaking families." },
  { id: "ref6", name: "SoCal Home Health", organization: "SoCal Home Health Services", type: "Home Health", email: "info@socalhh.com", phone: "(310) 555-6100", contactPerson: "Karen Lee", referredLeadIds: ["p13", "p15"], serviceHoursRequested: 200, commissionRate: 6, totalCommission: 0, score: "cold", status: "active", lastReferralDate: "2025-10-12", notes: "New partner. Pipeline building phase." },
  { id: "ref7", name: "Pacific Insurance Group", organization: "Pacific LTC Insurance", type: "Insurance", email: "agents@pacificins.com", phone: "(213) 555-2200", contactPerson: "Tom Rivera", referredLeadIds: ["p14", "p17"], serviceHoursRequested: 180, commissionRate: 4, totalCommission: 0, score: "cold", status: "inactive", lastReferralDate: "2025-08-30", notes: "Paused partnership. Re-evaluate Q2." },
];
