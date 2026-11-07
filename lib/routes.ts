import { site } from '../config/site';
import { routeNames, type Locale, type PageKey } from '../i18n';
export function route(lang: Locale, page: PageKey = 'home', slug?: string) {
  return `${site.presentation ? '/concepts/sentinel' : ''}/${lang}/${routeNames[lang][page] ? routeNames[lang][page] + '/' : ''}${slug ? slug + '/' : ''}`;
}
export function galleryRoute(lang: Locale) {
  return lang === 'ro' ? '/' : '/en/';
}
export { slugify } from './slug';
