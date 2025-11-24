import { EntitySchema } from "typeorm";
import { DeviceToken } from "@domain/entities/index.js";

export const DeviceTokenSchema = new EntitySchema<DeviceToken>({
  name: "DeviceToken",
  tableName: "device_tokens",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      name: "user_id",
      nullable: false,
    },
    token: {
      type: "varchar",
      length: 500,
      nullable: false,
      unique: true,
    },
    platform: {
      type: "enum",
      enum: ["ios", "android", "web"],
      nullable: false,
    },
    deviceName: {
      type: "varchar",
      length: 100,
      name: "device_name",
      nullable: true,
    },
    isActive: {
      type: Boolean,
      name: "is_active",
      default: true,
    },
    lastUsedAt: {
      type: "timestamp",
      name: "last_used_at",
      nullable: false,
    },
    createdAt: {
      type: "timestamp",
      name: "created_at",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      name: "updated_at",
      updateDate: true,
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "user_id",
      },
    },
  },
  indices: [
    {
      name: "IDX_DEVICE_TOKEN_USER_ACTIVE",
      columns: ["user_id", "is_active"],
    },
    {
      name: "IDX_DEVICE_TOKEN_TOKEN",
      columns: ["token"],
    },
  ],
});
