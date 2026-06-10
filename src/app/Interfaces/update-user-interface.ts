export interface UpdateUserInterface {
  id:        number;
  firstName: string | null;
  lastName:  string | null;
  email:     string | null;
  avatarUrl: string | null;
  role:      number | null;
}