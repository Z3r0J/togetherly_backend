import { MagicLinkToken } from "@domain/entities/index.js";
import { EntitySchema } from "typeorm";

export const MagicLinkSchema = new EntitySchema<MagicLinkToken>({
  name: "MagicLinkToken",
  tableName: "magic_link_tokens",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
    },
    token: {
      type: "nvarchar",
      length: 255,
      unique: true,
    },
    expiresAt: {
      type: "timestamp",
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    usedAt: {
      type: "timestamp",
      nullable: true,
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
      onDelete: "CASCADE",
    },
  },
});
