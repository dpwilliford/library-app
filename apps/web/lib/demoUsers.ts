import type { RoleName } from "@library-app/shared";

export type DemoUser = {
  email: string;
  password: string;
  name: string;
  role: RoleName;
  dashboardTitle: string;
  dashboardSummary: string;
  responsibility: string;
  panels: Array<{
    title: string;
    responsibility: string;
    actions: string;
    futureData: string;
  }>;
};

export const demoUsers: DemoUser[] = [
  {
    email: "student@library.test",
    password: "demo123",
    name: "Student Demo",
    role: "student",
    dashboardTitle: "Student View",
    dashboardSummary: "Explore librarian-reviewed collection information and describe learning or research needs.",
    responsibility: "Students help the library understand course, research, and creative needs from the learner perspective; they do not make collection decisions.",
    panels: [
      {
        title: "Explore Collection Information",
        responsibility: "Find library-owned and librarian-reviewed information without seeing unreviewed claims.",
        actions: "Later action: search librarian-reviewed reports and collection summaries.",
        futureData: "Will show librarian-reviewed reports, collection strengths, and selected title context."
      },
      {
        title: "Explain A Learning Need",
        responsibility: "Describe why a title, topic, format, or creator matters for a class or project.",
        actions: "Later action: submit a recommendation for librarian review.",
        futureData: "Will show recommendation status and any librarian response."
      },
      {
        title: "Track Student Suggestions",
        responsibility: "Understand that suggestions support review but do not make purchase decisions.",
        actions: "Later action: view submitted recommendation history.",
        futureData: "Will show submitted, reviewed, or deferred suggestions."
      }
    ]
  },
  {
    email: "professor@library.test",
    password: "demo123",
    name: "Professor Demo",
    role: "professor",
    dashboardTitle: "Professor View",
    dashboardSummary: "Connect collection needs to courses, assignments, programs, research areas, and teaching priorities.",
    responsibility: "Professors help the library understand curriculum relevance and teaching value.",
    panels: [
      {
        title: "Course And Assignment Needs",
        responsibility: "Link future recommendations to actual teaching use.",
        actions: "Later action: attach a title or topic to a course, assignment, or learning outcome.",
        futureData: "Will show course/program relevance and related collection coverage."
      },
      {
        title: "Program-Level Gaps",
        responsibility: "Help identify where the collection does not yet support a curriculum area.",
        actions: "Later action: explain a program need for librarian review.",
        futureData: "Will show program areas, faculty context, and reviewed collection gaps."
      },
      {
        title: "Teaching Significance",
        responsibility: "Document why a work, creator, format, or movement matters for instruction.",
        actions: "Later action: submit teaching rationale with a recommendation.",
        futureData: "Will show reviewed evidence and librarian decision status."
      }
    ]
  },
  {
    email: "librarian@library.test",
    password: "demo123",
    name: "Librarian Demo",
    role: "librarian",
    dashboardTitle: "Librarian View",
    dashboardSummary: "Review collection information, evidence, recommendations, and provisional knowledge before anything becomes authoritative.",
    responsibility: "Librarians verify evidence, review recommendations, and prepare collection-development proposals.",
    panels: [
      {
        title: "Collection Review",
        responsibility: "Check what the library owns and where records need attention.",
        actions: "Later action: review catalog records, holdings, formats, and collection areas.",
        futureData: "Will show catalog records, holdings status, usage signals, and collection-area assignments."
      },
      {
        title: "Evidence Review",
        responsibility: "Separate supported claims from unverified or provisional information.",
        actions: "Later action: mark evidence-backed claims as ready, not ready, or needing revision.",
        futureData: "Will show source, excerpt, date accessed, confidence level, and review status."
      },
      {
        title: "Collection Reports",
        responsibility: "Turn reviewed information into clear reports for planning and discussion.",
        actions: "Later action: create reports for collection strengths, gaps, and priorities.",
        futureData: "Will show reviewed claims, local holdings, recommendations, and policy basis."
      }
    ]
  },
  {
    email: "area@library.test",
    password: "demo123",
    name: "Collection-Area Librarian Demo",
    role: "collection_area_librarian",
    dashboardTitle: "Collection-Area Librarian View",
    dashboardSummary: "Monitor assigned collection areas, gaps, usage signals, market alerts, and proposals that may need escalation.",
    responsibility: "Collection-area librarians watch specific subject areas and prepare evidence-based proposals.",
    panels: [
      {
        title: "Assigned Collection Areas",
        responsibility: "Focus on the media, genre, format, or subject areas assigned to this role.",
        actions: "Later action: review area-level holdings, recommendations, and activity.",
        futureData: "Will show assigned areas, local holdings, new recommendations, and review counts."
      },
      {
        title: "Gaps And Redundancy",
        responsibility: "Notice missing coverage and avoid duplicate or redundant editions unless they add value.",
        actions: "Later action: flag collection gaps or redundancy concerns.",
        futureData: "Will show collection balance, usage, reviewed field context, and overlap indicators."
      },
      {
        title: "Escalate Acquisition Proposals",
        responsibility: "Prepare proposals for the head librarian with evidence and policy basis.",
        actions: "Later action: send a reviewed proposal to the head librarian decision queue.",
        futureData: "Will show proposed title, rationale, evidence, market status, and decision history."
      }
    ]
  },
  {
    email: "head@library.test",
    password: "demo123",
    name: "Head Librarian Demo",
    role: "head_librarian",
    dashboardTitle: "Head Librarian View",
    dashboardSummary: "Set targets, review proposals, compare evidence, and make final collection-development decisions.",
    responsibility: "The head librarian owns final approval, deferral, or rejection of acquisition decisions.",
    panels: [
      {
        title: "Collection Targets",
        responsibility: "Set collection-development targets by month and collection area.",
        actions: "Later action: define monthly acquisition and percentage targets.",
        futureData: "Will show targets, progress, distribution, and collection balance."
      },
      {
        title: "Decision Queue",
        responsibility: "Make final decisions after librarian review and evidence preparation.",
        actions: "Later action: approve, reject, or defer acquisition proposals.",
        futureData: "Will show rationale, evidence, redundancy notes, policy basis, and decision log."
      },
      {
        title: "Decision-Support Analytics",
        responsibility: "Use reproducible reports to understand gaps, strengths, usage, and priorities.",
        actions: "Later action: review analytics before final decisions.",
        futureData: "Will show acquisition activity, checkout trends, recommendation counts, and pending reviews."
      }
    ]
  },
  {
    email: "admin@library.test",
    password: "demo123",
    name: "Administrator Demo",
    role: "administrator",
    dashboardTitle: "Administrator View",
    dashboardSummary: "Manage access, permissions, and system configuration without making collection-development decisions.",
    responsibility: "Administrators maintain the system and user access; they do not replace librarian review authority.",
    panels: [
      {
        title: "User Access",
        responsibility: "Maintain who can log in and which role each person has.",
        actions: "Later action: invite, deactivate, or update users.",
        futureData: "Will show user accounts, role assignments, and account status."
      },
      {
        title: "Permission Settings",
        responsibility: "Keep role permissions aligned with project governance.",
        actions: "Later action: manage role-based access rules.",
        futureData: "Will show roles, permissions, and access-change history."
      },
      {
        title: "System Configuration",
        responsibility: "Maintain system settings, exports, and operational safeguards.",
        actions: "Later action: review configuration and export settings.",
        futureData: "Will show system settings, export options, and audit-related controls."
      }
    ]
  }
];

export function findDemoUser(email: string, password: string) {
  return demoUsers.find((user) => user.email === email.toLowerCase() && user.password === password) ?? null;
}

export function getDemoUserByEmail(email: string) {
  return demoUsers.find((user) => user.email === email.toLowerCase()) ?? null;
}
