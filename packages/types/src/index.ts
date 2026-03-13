export type EventCategory =
  | "gottesdienst"
  | "konzert"
  | "jugend"
  | "gemeindeleben"
  | "lesung"
  | "diskussion"
  | "andacht";

export interface EventDTO {
  id: string;
  title: string;
  startsAt: string; // ISO 8601
  endsAt?: string;
  category: EventCategory;
  location: {
    lat: number;
    lon: number;
    address: string;
  };
  congregationId: string;
  description?: string;
  imageUrl?: string;
  source: "manual" | "churchdesk";
  price?: string;
  registrationUrl?: string;
  bringItems?: string;
  persons?: string;
}

/** Schlanke Variante fuer Listenansicht / Map-Marker — ohne description/bringItems */
export interface EventListItemDTO {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  category: EventCategory;
  location: {
    lat: number;
    lon: number;
    address: string;
  };
  congregationId: string;
  imageUrl?: string;
  source: "manual" | "churchdesk";
  price?: string;
  registrationUrl?: string;
  persons?: string;
}

export interface CongregationDTO {
  id: string;
  name: string;
  address: string;
  websiteUrl?: string;
  location: {
    lat: number;
    lon: number;
  };
}

export type CongregationDetailDTO = CongregationDTO & {
  events: EventDTO[];
};
