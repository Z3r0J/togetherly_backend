import { Credential } from "@domain/entities";
import { EntitySchema } from "typeorm";

export const CredentialSchema = new EntitySchema<Credential>({
  name: "Credential",
  tableName: "credentials",
  columns: {
    userId: {
      type: "uuid",
      primary: true,
      unique: true,
    },
    passwordHash: {
      type: "nvarchar",
      length: 255,
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
  indices: [
    {
      name: "IDX_CREDENTIAL_USER_ID",
      columns: ["userId"],
      unique: true,
    },
  ],
  relations: {
    user: {
      type: "one-to-one",
      target: "User",
      joinColumn: { name: "userId" },
      inverseSide: "credential",
    },
  },
});
