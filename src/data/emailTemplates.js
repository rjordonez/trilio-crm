export const defaultTemplates = [
  {
    id: "t1",
    name: "Post-Inquiry Welcome",
    subject: "Welcome — Next Steps for {{name}}",
    body: `Hi {{contact_person}},

Thank you for reaching out about care options for {{name}}. We understand this is an important decision, and we're here to help every step of the way.

Based on our conversation, I'd love to schedule a personalized tour so you can see firsthand how we can support {{name}}'s care needs.

Here's what to expect:
- A guided tour of our living spaces and amenities
- Introduction to our care team
- Q&A session to address all your questions

Would any of the following times work for you this week?

Looking forward to connecting!

Best,
{{sender_name}}`,
    createdAt: "2026-02-01",
  },
  {
    id: "t2",
    name: "Post-Tour Follow-Up",
    subject: "Great meeting you — {{name}}'s tour recap",
    body: `Hi {{contact_person}},

It was wonderful meeting you and showing you around! I hope the visit gave you a good sense of the care and community we offer.

As discussed during the tour, here are a few highlights:
- Our dedicated care team and personalized care plans
- Daily activities and social programming
- Beautiful common areas and outdoor spaces

I'm attaching the floor plan options and pricing we discussed. Please don't hesitate to reach out with any questions.

[Write personal note here — mention something specific from the tour or their concerns]

Best regards,
{{sender_name}}`,
    createdAt: "2026-02-05",
  },
  {
    id: "t3",
    name: "Check-In / Nurture",
    subject: "Checking in — How is {{name}} doing?",
    body: `Hi {{contact_person}},

I wanted to check in and see how things are going with {{name}}. I know making a decision about care takes time, and I want you to know we're here whenever you're ready.

In the meantime, I thought you might find these resources helpful:
- Our monthly activity calendar
- A guide to transitioning to senior living
- Testimonials from families in similar situations

Is there anything I can help with or any questions I can answer?

Warm regards,
{{sender_name}}`,
    createdAt: "2026-02-08",
  },
  {
    id: "t4",
    name: "Monthly Newsletter",
    subject: "Monthly Newsletter — Community Updates",
    body: `Hi {{contact_person}},

Here's what's been happening in our community this month!

Community Highlights
- We welcomed new residents to our family this month
- [Mention recent improvement or renovation]
- Staff spotlight: [Highlight a team member]

Upcoming Events
- [Date] — [Event name and time]
- [Date] — [Event name and time]
- [Date] — [Event name and time]

Wellness Corner
[Brief wellness tip or health awareness topic]

We'd love for you and {{name}} to visit and experience our community firsthand. Reply to schedule a personal tour anytime.

Warmly,
{{sender_name}}`,
    createdAt: "2026-02-10",
  },
  {
    id: "t5",
    name: "Event Invitation",
    subject: "You're Invited — Special Event",
    body: `Hi {{contact_person}},

We're excited to invite you and {{name}} to a special upcoming event!

[Event name]
Date: [Date]
Time: [Time]
Location: [Location]

What to expect:
- Guided tours of our living spaces, dining areas, and amenities
- Meet our care team, activity directors, and fellow residents
- Complimentary refreshments
- Q&A sessions with our leadership team

This is a wonderful opportunity to experience daily life in our community and meet the people who make it so special.

[Write personal note here — reference their specific interests or concerns]

Please RSVP by replying to this email or calling us directly. We'd love to save a spot for you!

Hope to see you there,
{{sender_name}}`,
    createdAt: "2026-02-11",
  },
  {
    id: "t6",
    name: "Rejection Notice",
    subject: "Update regarding {{name}}'s care inquiry",
    body: `Hi {{contact_person}},

Thank you for reaching out to us about care options for {{name}}. We truly appreciate the time you took to explore what we have to offer.

After careful consideration, we're not able to move forward with services for {{name}} at this time. We understand this may be disappointing, and we want you to know this decision was not made lightly.

We encourage you to:
- Reach out to us in the future if circumstances change
- Contact your local Area Agency on Aging for additional resources
- Explore other care providers who may better fit your needs

We wish you and {{name}} all the best, and please don't hesitate to contact us if we can help in any way.

Warm regards,
{{sender_name}}`,
    createdAt: "2026-03-01",
  },
];

export function personalizeContent(body, lead, senderName) {
  const contactName = lead.contactPerson === "Self" ? lead.name : lead.contactPerson;
  let text = body
    .replace(/\{\{name\}\}/g, lead.name || "")
    .replace(/\{\{contact_person\}\}/g, contactName || "")
    .replace(/\{\{care_level\}\}/g, lead.careLevel || "")
    .replace(/\{\{sender_name\}\}/g, senderName || "");

  return text.trim();
}
