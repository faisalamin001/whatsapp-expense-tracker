export interface UpsertUserInput {
  phone: string;
  name?: string;
}

export interface UserResult {
  id: string;
  phone: string;
  name: string | null;
  currency: string;
  createdAt: Date;
}
