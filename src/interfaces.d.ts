export interface ICommunity {
  name: string;
  slug?: string;
  description?: string;
  count?: number;
}

export interface IEvent {
  name: string;
  description?: string;
  community: string;
  venue: string;
  date: string;
  recurring?: boolean;
  createdBy: string;
}

export interface IUser {
  id: string;
  name: string;
  image?: string;
}