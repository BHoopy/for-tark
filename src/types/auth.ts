export type AuthUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  coverImageURL: string | null;
  isGuest: boolean;
};
