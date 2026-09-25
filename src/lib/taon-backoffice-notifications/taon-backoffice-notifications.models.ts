export interface TaonNotificationOptions {
  title: string;
  subtitle?: string;
}

export type TaonNotificationType = 'success' | 'error' | 'warning' | 'info';

export type TaonNotificationInput = TaonNotificationOptions | string;
