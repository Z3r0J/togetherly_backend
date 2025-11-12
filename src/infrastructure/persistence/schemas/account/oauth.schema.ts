import { EntitySchema } from "typeorm";
import { OAuth } from "@domain/entities";

/**
 * TypeORM schema for OAuth entity
 * Maps pure domain entity to database
 */
export const OAuthSchema = new EntitySchema<OAuth>({
  name: "OAuth",
  tableName: "oauths",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    provider: {
      type: "nvarchar",
      length: 100,
    },
    userId: {
      type: "uuid",
    },
    providerAccountId: {
      type: "nvarchar",
      length: 255,
    },
    providerEmail: {
      type: "nvarchar",
      length: 255,
      nullable: true,
    },
    accessToken: {
      type: "nvarchar",
      length: 500,
    },
    refreshToken: {
      type: "nvarchar",
      length: 500,
      nullable: true,
    },
    expiresAt: {
      type: "timestamp",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
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
