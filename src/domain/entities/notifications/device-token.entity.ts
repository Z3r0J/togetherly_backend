/**
 * Device Token Entity
 * @author Jean Carlos Reyes
 * @description Represents a device FCM token for push notifications
 * @version 1.0.0
 */

import { User } from "../account/user.entity.js";

export type DevicePlatform = "ios" | "android" | "web";

export interface DeviceToken {
  id?: string;
  userId: string;
  user?: User;
  token: string; // FCM token
  platform: DevicePlatform;
  deviceName?: string; // e.g., "iPhone 14", "Pixel 8"
  isActive: boolean;
  lastUsedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createDeviceToken = (
  props: Omit<DeviceToken, "id" | "createdAt" | "updatedAt">
): DeviceToken => {
  return {
    userId: props.userId,
    token: props.token,
    platform: props.platform,
    deviceName: props.deviceName,
    isActive: props.isActive,
    lastUsedAt: props.lastUsedAt,
  };
};
