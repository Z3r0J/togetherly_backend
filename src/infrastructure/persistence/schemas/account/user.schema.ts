import { EntitySchema } from "typeorm";
import { User } from "@domain/entities/account/user.entity.js";

/**
 * TypeORM schema for User entity
 * Maps pure domain entity to database
 */
export const UserSchema = new EntitySchema<User>({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "nvarchar",
      length: 255,
    },
    email: {
      type: "nvarchar",
      length: 255,
      unique: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: "timestamp",
      nullable: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: "timestamp",
      nullable: true,
    },
  },
  indices: [
    {
      name: "IDX_USER_EMAIL",
      columns: ["email"],
      unique: true,
    },
  ],
});
