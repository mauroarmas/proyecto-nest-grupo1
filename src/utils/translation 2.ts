import { I18nService } from 'nestjs-i18n';

export function translate(i18n: I18nService, key: string): string {
  return i18n.translate(key);
}