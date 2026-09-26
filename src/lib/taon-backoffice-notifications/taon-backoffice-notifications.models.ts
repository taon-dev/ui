export interface TaonNotificationOptions {
  title: string;
  subtitle?: string;

  /**
   * Optional technical details.
   * When present, notification can open a details dialog.
   */
  details?: string;
}

export type TaonNotificationType = 'success' | 'error' | 'warning' | 'info';

export type TaonNotificationInput = TaonNotificationOptions | string;
