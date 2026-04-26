import type { Claim, Evidence, Holding, Instantiation, Recommendation, Title, User, Work } from "./models";

export const mockUsers: User[] = [
  { id: "user-student", name: "Student Demo", role: "student", department: "Media Arts" },
  { id: "user-professor", name: "Professor Demo", role: "professor", department: "Animation" },
  { id: "user-librarian", name: "Librarian Demo", role: "librarian" },
  { id: "user-area", name: "Collection-Area Librarian Demo", role: "collection_area_librarian" },
  { id: "user-head", name: "Head Librarian Demo", role: "head_librarian" },
  { id: "user-admin", name: "Administrator Demo", role: "administrator" }
];

export const mockTitles: Title[] = [
  {
    id: "akira",
    name: "Akira",
    collectionArea: "Manga/Anime",
    summary: "Mock title cluster for a cyberpunk manga work and its major media instantiations.",
    workIds: ["work-akira-manga"]
  },
  {
    id: "persepolis",
    name: "Persepolis",
    collectionArea: "Comics/Graphic Novels",
    summary: "Mock title cluster for a memoir work represented through graphic narrative and film.",
    workIds: ["work-persepolis-comic"]
  },
  {
    id: "nausicaa",
    name: "Nausicaa of the Valley of the Wind",
    collectionArea: "Manga/Anime",
    summary: "Mock title cluster for a manga work with film adaptation and collected editions.",
    workIds: ["work-nausicaa-manga"]
  }
];

export const mockWorks: Work[] = [
  {
    id: "work-akira-manga",
    titleId: "akira",
    name: "Akira manga",
    originalYear: 1982,
    creators: ["Katsuhiro Otomo"],
    originCountry: "Japan",
    medium: "Manga"
  },
  {
    id: "work-persepolis-comic",
    titleId: "persepolis",
    name: "Persepolis graphic memoir",
    originalYear: 2000,
    creators: ["Marjane Satrapi"],
    originCountry: "France/Iran",
    medium: "Graphic memoir"
  },
  {
    id: "work-nausicaa-manga",
    titleId: "nausicaa",
    name: "Nausicaa manga",
    originalYear: 1982,
    creators: ["Hayao Miyazaki"],
    originCountry: "Japan",
    medium: "Manga"
  }
];

export const mockInstantiations: Instantiation[] = [
  {
    id: "inst-akira-vol-1",
    workId: "work-akira-manga",
    label: "Akira Volume 1 paperback",
    format: "Book",
    year: 2009,
    relationToWork: "translation",
    ownershipStatus: "owned",
    holdingId: "hold-akira-vol-1"
  },
  {
    id: "inst-akira-box",
    workId: "work-akira-manga",
    label: "Akira 35th Anniversary Box Set",
    format: "Box set",
    year: 2017,
    relationToWork: "reissue",
    ownershipStatus: "not_owned"
  },
  {
    id: "inst-akira-film",
    workId: "work-akira-manga",
    label: "Akira animated film",
    format: "Blu-ray",
    year: 1988,
    relationToWork: "adaptation",
    ownershipStatus: "owned",
    holdingId: "hold-akira-film"
  },
  {
    id: "inst-persepolis-complete",
    workId: "work-persepolis-comic",
    label: "The Complete Persepolis",
    format: "Book",
    year: 2007,
    relationToWork: "collected_edition",
    ownershipStatus: "owned",
    holdingId: "hold-persepolis-complete"
  },
  {
    id: "inst-persepolis-film",
    workId: "work-persepolis-comic",
    label: "Persepolis animated film",
    format: "DVD",
    year: 2007,
    relationToWork: "adaptation",
    ownershipStatus: "not_owned"
  },
  {
    id: "inst-persepolis-french",
    workId: "work-persepolis-comic",
    label: "Persepolis original French edition",
    format: "Book",
    year: 2000,
    relationToWork: "original",
    ownershipStatus: "not_owned"
  },
  {
    id: "inst-nausicaa-box",
    workId: "work-nausicaa-manga",
    label: "Nausicaa manga box set",
    format: "Box set",
    year: 2012,
    relationToWork: "collected_edition",
    ownershipStatus: "owned",
    holdingId: "hold-nausicaa-box"
  },
  {
    id: "inst-nausicaa-film",
    workId: "work-nausicaa-manga",
    label: "Nausicaa animated film",
    format: "Blu-ray",
    year: 1984,
    relationToWork: "adaptation",
    ownershipStatus: "not_owned"
  }
];

export const mockHoldings: Holding[] = [
  {
    id: "hold-akira-vol-1",
    instantiationId: "inst-akira-vol-1",
    localIdentifier: "MOCK-CG-001",
    location: "Media Arts Library",
    acquisitionYear: 2021,
    status: "available"
  },
  {
    id: "hold-akira-film",
    instantiationId: "inst-akira-film",
    localIdentifier: "MOCK-DVD-014",
    location: "Media Viewing Collection",
    acquisitionYear: 2019,
    status: "available"
  },
  {
    id: "hold-persepolis-complete",
    instantiationId: "inst-persepolis-complete",
    localIdentifier: "MOCK-GN-032",
    location: "Graphic Novels",
    acquisitionYear: 2018,
    status: "available"
  },
  {
    id: "hold-nausicaa-box",
    instantiationId: "inst-nausicaa-box",
    localIdentifier: "MOCK-MA-018",
    location: "Manga/Anime",
    acquisitionYear: 2022,
    status: "in_review"
  }
];

export const mockEvidence: Evidence[] = [
  {
    id: "evidence-akira-course",
    sourceLabel: "Mock course bibliography",
    supportingData: "Animation history course uses cyberpunk and theatrical anime examples.",
    dateAccessed: "2026-04-26",
    confidence: "medium",
    reviewStatus: "mock_pending_review"
  },
  {
    id: "evidence-persepolis-curriculum",
    sourceLabel: "Mock faculty note",
    supportingData: "Graphic memoir appears in visual narrative and memoir assignments.",
    dateAccessed: "2026-04-26",
    confidence: "medium",
    reviewStatus: "mock_reviewed"
  },
  {
    id: "evidence-nausicaa-gap",
    sourceLabel: "Mock collection gap note",
    supportingData: "Film adaptation is not represented in the local mock holdings.",
    dateAccessed: "2026-04-26",
    confidence: "low",
    reviewStatus: "mock_pending_review"
  }
];

export const mockClaims: Claim[] = [
  {
    id: "claim-akira-teaching",
    titleId: "akira",
    statement: "Akira is relevant to animation, manga, and cyberpunk teaching contexts.",
    evidenceIds: ["evidence-akira-course"],
    reviewStatus: "mock_pending_review"
  },
  {
    id: "claim-persepolis-teaching",
    titleId: "persepolis",
    statement: "Persepolis supports teaching about graphic memoir and visual narrative.",
    evidenceIds: ["evidence-persepolis-curriculum"],
    reviewStatus: "mock_reviewed"
  },
  {
    id: "claim-nausicaa-gap",
    titleId: "nausicaa",
    statement: "The mock collection owns the manga box set but not the animated film adaptation.",
    evidenceIds: ["evidence-nausicaa-gap"],
    reviewStatus: "mock_pending_review"
  }
];

export const mockRecommendations: Recommendation[] = [
  {
    id: "rec-akira-box",
    titleId: "akira",
    submittedByUserId: "user-professor",
    reason: "Compare standard volumes with a collected archival edition.",
    courseOrProgram: "Animation History",
    status: "mock_under_review"
  },
  {
    id: "rec-nausicaa-film",
    titleId: "nausicaa",
    submittedByUserId: "user-area",
    reason: "Pair the manga collection with the film adaptation for media genealogy teaching.",
    courseOrProgram: "Manga/Anime",
    status: "mock_submitted"
  }
];

