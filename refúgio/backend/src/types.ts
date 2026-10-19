export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface StoredUser extends PublicUser {
  salt: string;
  hash: string;
}

export interface TokenPayload {
  sub: string;
  exp: number;
}

export function publicUser(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}
