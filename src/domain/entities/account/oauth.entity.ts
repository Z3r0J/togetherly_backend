import { User } from "./user.entity";

/**
 * OAuth Entity
 * @author Jean Carlos Reyes
 * @description Represents an OAuth account in the system.
 * @version 1.0.0
 */

export interface OAuth {
  id?: string;
  userId: string;
  user?: User;
  provider: string;
  providerAccountId: string;
  providerEmail?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const createOAuth = (
  props: Omit<
    OAuth,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): OAuth => {
  return {
    provider: props.provider,
    userId: props.userId,
    providerAccountId: props.providerAccountId,
    accessToken: props.accessToken,
    refreshToken: props.refreshToken,
    expiresAt: props.expiresAt,
  };
};
