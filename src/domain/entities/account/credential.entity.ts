import { User } from "./user.entity";

export interface Credential {
  userId?: string;
  user?: User;
  passwordHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createCredential = (
  props: Omit<Credential, "userId" | "createdAt" | "updatedAt">
): Credential => {
  return {
    passwordHash: props.passwordHash,
  };
};
