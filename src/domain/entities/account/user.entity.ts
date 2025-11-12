import { Credential } from "./credential.entity";
import { MagicLinkToken } from "./magic-link-token.entity";
import { OAuth } from "./oauth.entity";

/**
 * User Entity
 * @author Jean Carlos Reyes
 * @description Represents a user in the system.
 * @version 1.0.0
 */

export interface User {
  id?: string;
  name: string;
  email: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  credential?: Credential;
  magicLinkTokens?: MagicLinkToken[];
  oauths?: OAuth[];
}

export const createUser = (
  props: Omit<
    User,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "isDeleted"
    | "deletedAt"
    | "isEmailVerified"
    | "emailVerifiedAt"
  >
): User => {
  return {
    name: props.name,
    email: props.email,
  };
};
