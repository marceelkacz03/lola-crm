import type {
  AccountSource,
  AccountType,
  ActivityType,
  AiAngle,
  AiDraftStatus,
  AiDraftType,
  AppRole,
  SalesStatus,
  DealEventType,
  DealStatus,
  EventStatus
} from "@/lib/types";

export const roleLabel = (role: AppRole) =>
  (
    {
      ADMIN: "Administrator",
      BOARD: "Zarząd",
      MANAGER: "Menedżer",
      STAFF: "Obsługa"
    } satisfies Record<AppRole, string>
  )[role];

export const accountTypeLabel = (type: AccountType) =>
  (
    {
      company: "Firma",
      private: "Osoba prywatna",
      wedding_planner: "Konsultant ślubny"
    } satisfies Record<AccountType, string>
  )[type];

export const accountSourceLabel = (source: AccountSource) =>
  (
    {
      internal_base: "Baza wewnętrzna",
      own_portfolio: "Własne portfolio",
      planner: "Konsultant ślubny",
      networking: "Sieć kontaktów",
      other: "Inne"
    } satisfies Record<AccountSource, string>
  )[source];

export const dealEventTypeLabel = (type: DealEventType) =>
  (
    {
      corporate: "Firmowe",
      wedding: "Wesele",
      private: "Prywatne",
      other: "Inne"
    } satisfies Record<DealEventType, string>
  )[type];

export const dealStatusLabel = (status: DealStatus) =>
  (
    {
      new_lead: "Nowy lead",
      contacted: "Skontaktowano",
      offer_sent: "Wysłano ofertę",
      negotiation: "Negocjacje",
      reserved: "Zarezerwowane",
      lost: "Utracone"
    } satisfies Record<DealStatus, string>
  )[status];

export const eventStatusLabel = (status: EventStatus) =>
  (
    {
      planned: "Planowane",
      confirmed: "Potwierdzone",
      completed: "Zrealizowane"
    } satisfies Record<EventStatus, string>
  )[status];

export const activityTypeLabel = (type: ActivityType) =>
  (
    {
      call: "Telefon",
      email: "E-mail",
      meeting: "Spotkanie",
      other: "Inne"
    } satisfies Record<ActivityType, string>
  )[type];

export const salesStatusLabel = (status: SalesStatus) =>
  (
    {
      new: "Nowy",
      contacted: "Kontakt",
      offer_sent: "Oferta wyslana",
      negotiation: "Negocjacje",
      won: "Zrealizowane",
      lost: "Przegrany"
    } satisfies Record<SalesStatus, string>
  )[status];

export const aiAngleLabel = (angle: AiAngle) =>
  (
    {
      extravaganza: "Extravaganza",
      intimate: "Kameralnie",
      cultural_bridge: "Cultural Bridge",
      milestone: "Milestone"
    } satisfies Record<AiAngle, string>
  )[angle];

export const aiDraftTypeLabel = (type: AiDraftType) =>
  (
    {
      first_contact: "Pierwszy kontakt",
      followup_1: "Follow-up 1",
      followup_2: "Follow-up 2",
      followup_3: "Follow-up 3"
    } satisfies Record<AiDraftType, string>
  )[type];

export const aiDraftStatusLabel = (status: AiDraftStatus) =>
  (
    {
      draft: "Szkic",
      sent: "Wysłano",
      skipped: "Pominięto"
    } satisfies Record<AiDraftStatus, string>
  )[status];
