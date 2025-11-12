import { User } from "..";

export interface MagicLinkToken {
  id?: string;
  userId: string;
  user?: User;
  token: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt?: Date;
}
export const createMagicLinkToken = (
  props: Omit<MagicLinkToken, "id" | "createdAt" | "usedAt">
): MagicLinkToken => {
  return {
    userId: props.userId,
    token: props.token,
    expiresAt: props.expiresAt,
  };
};
