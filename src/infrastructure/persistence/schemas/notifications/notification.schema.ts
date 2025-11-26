import { EntitySchema } from "typeorm";
import { Notification } from "@domain/entities/index.js";

export const NotificationSchema = new EntitySchema<Notification>({
  name: "Notification",
  tableName: "notifications",
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
    type: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    category: {
      type: "enum",
      enum: ["event", "circle", "rsvp"],
      nullable: false,
    },
    title: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    body: {
      type: "text",
      nullable: false,
    },
    priority: {
      type: "enum",
      enum: ["normal", "high"],
      default: "normal",
    },
    iconType: {
      type: "varchar",
      length: 50,
      name: "icon_type",
      nullable: false,
    },
    iconColor: {
      type: "varchar",
      length: 20,
      name: "icon_color",
      nullable: false,
    },
    actionButtons: {
      type: "simple-json",
      name: "action_buttons",
      nullable: false,
    },
    metadata: {
      type: "simple-json",
      nullable: false,
    },
    isRead: {
      type: Boolean,
      name: "is_read",
      default: false,
    },
    readAt: {
      type: "timestamp",
      name: "read_at",
      nullable: true,
    },
    dismissedAt: {
      type: "timestamp",
      name: "dismissed_at",
      nullable: true,
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
  indices: [
    {
      name: "IDX_NOTIFICATION_USER_CATEGORY_READ",
      columns: ["userId", "category", "isRead", "createdAt"],
    },
    {
      name: "IDX_NOTIFICATION_USER_READ",
      columns: ["userId", "isRead"],
    },
    {
      name: "IDX_NOTIFICATION_CREATED",
      columns: ["createdAt"],
    },
  ],
});
