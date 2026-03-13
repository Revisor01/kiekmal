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
