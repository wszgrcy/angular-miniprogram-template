import { clearTranslations, loadTranslations } from '@angular/localize';

export type LocaleId = 'zh' | 'en';

const STORAGE_KEY = 'demo.locale';

/**
 * 英文译文表。中文是源语言，写在模板里，不需要表。
 *
 * key 是消息 id。模板里一律用 `i18n="@@xxx"` 显式命名 —— 不命名的消息
 * 由编译器按文案算哈希（`computeMsgId`），改一个字 id 就变，没法维护。
 *
 * 译文里的占位符名必须和编译产物逐字一致，**写错不报错**，只会静默退回源文案。
 * 名字是编译器生成的，去产物里 grep 反引号包起来的那串最准：
 *
 * ```bash
 * grep -o '`:[^`]*`' dist/<app>/pages/i18n/i18n-entry.js
 * ```
 *
 * 规律：
 *   模板插值       → `{$INTERPOLATION}`（多个依次 `_1`、`_2`）
 *   ICU 的变量     → `VAR_SELECT` / `VAR_PLURAL`，裸写、不带 `{$}`
 *                    （它由 `ɵɵi18nPostprocess` 在译文求值**之后**替换）
 *   ICU 分支里的插值 → `{INTERPOLATION}`
 */
const EN: Record<string, string> = {
  'i18n.title': 'Internationalization',
  'i18n.switch': 'Switch locale',
  'i18n.live': 'This line is re-evaluated on every read',
  'i18n.plain': 'Static text and interpolation',
  'i18n.cart': 'Cart',
  'i18n.cartCount': '{$INTERPOLATION} item(s) in the cart',
  'i18n.icu': 'ICU (select / plural)',
  'i18n.select': '{VAR_SELECT, select, male {he} female {she} other {they}}',
  'i18n.plural':
    '{VAR_PLURAL, plural, =0 {nothing yet} one {just one} other {{INTERPOLATION} in total}}',
  'i18n.attr': 'i18n attributes',
  'i18n.alt': 'photo {$INTERPOLATION}',
  'i18n.titleAttr': 'caption',
};

/** 读上次选的语言；没存过就按源语言 */
export function readStoredLocale(): LocaleId {
  return wx.getStorageSync(STORAGE_KEY) === 'en' ? 'en' : 'zh';
}

/**
 * 换语言。
 *
 * `loadTranslations` 只往注册表里**加**，切回去必须先 `clearTranslations`。
 *
 * 生效时机有讲究：模板文案的译文在组件 `consts` 首次求值时就定死了，而
 * `consts` 每个组件类型只求一次。所以这行只对「还没渲染过的组件」起作用，
 * 已经渲染出来的要等小程序重启 —— 见 demo 页那个重启按钮。
 */
export function applyLocale(id: LocaleId) {
  wx.setStorageSync(STORAGE_KEY, id);
  clearTranslations();
  loadTranslations(id === 'en' ? EN : {});
}
