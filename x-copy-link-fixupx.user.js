// ==UserScript==
// @name         X → fixupx: Copy link
// @namespace    lex.userscripts
// @author       Lex Fradski
// @version      1.0.0
// @description  Rewrites x.com / twitter.com to fixupx.com on "Copy link" for proper embeds in Telegram and Discord
// @match        https://x.com/*
// @match        https://twitter.com/*
// @match        https://mobile.twitter.com/*
// @run-at       document-start
// @grant        none
// @sandbox      raw
// @inject-into  page
// @updateURL    https://raw.githubusercontent.com/sermelipharo/x-copy-link-fixupx/main/x-copy-link-fixupx.user.js
// @downloadURL  https://raw.githubusercontent.com/sermelipharo/x-copy-link-fixupx/main/x-copy-link-fixupx.user.js
// @homepageURL  https://github.com/sermelipharo/x-copy-link-fixupx
// @supportURL   https://github.com/sermelipharo/x-copy-link-fixupx/issues
// ==/UserScript==

(() => {
  'use strict';

  const TARGET_HOST = 'fixupx.com';
  // Tracking params X appends to copied links (?s=20&t=...)
  const STRIP_PARAMS = ['s', 't'];

  const HOST_RE = /^(?:www\.|mobile\.)?(?:x|twitter)\.com$/i;
  const STATUS_RE = /\/status(?:es)?\/\d+/;

  // Rewrite only when the whole copied text is a single post URL
  function fix(text) {
    if (typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed || /\s/.test(trimmed)) return text;

    let url;
    try { url = new URL(trimmed); } catch { return text; }
    if (!HOST_RE.test(url.hostname) || !STATUS_RE.test(url.pathname)) return text;

    url.protocol = 'https:';
    url.hostname = TARGET_HOST;
    for (const p of STRIP_PARAMS) url.searchParams.delete(p);
    return url.href;
  }

  // 1. Async Clipboard API: navigator.clipboard.writeText / write
  const proto = window.Clipboard && Clipboard.prototype;
  if (proto) {
    const origWriteText = proto.writeText;
    if (origWriteText) {
      proto.writeText = function (text) {
        return origWriteText.call(this, fix(text));
      };
    }

    const origWrite = proto.write;
    if (origWrite && window.ClipboardItem) {
      proto.write = function (items) {
        let patched = items;
        try {
          patched = Array.from(items, (item) => {
            if (!item.types.includes('text/plain')) return item;
            const parts = {};
            for (const type of item.types) {
              parts[type] = type === 'text/plain'
                ? item.getType(type)
                    .then((blob) => blob.text())
                    .then((t) => new Blob([fix(t)], { type }))
                : item.getType(type);
            }
            return new ClipboardItem(parts);
          });
        } catch (_) {
          patched = items;
        }
        return origWrite.call(this, patched);
      };
    }
  }

  // 2. Legacy path: document.execCommand('copy') + setData in a copy handler
  const origSetData = DataTransfer.prototype.setData;
  DataTransfer.prototype.setData = function (type, data) {
    if (/^text(?:\/plain)?$/i.test(type)) data = fix(data);
    return origSetData.call(this, type, data);
  };

  // 3. execCommand('copy') on a selection in a hidden textarea/input or on the page
  document.addEventListener('copy', (e) => {
    if (!e.clipboardData) return;
    const el = document.activeElement;
    let text;
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') &&
        typeof el.selectionStart === 'number') {
      text = el.value.slice(el.selectionStart, el.selectionEnd);
    } else {
      text = String(window.getSelection() || '');
    }
    const fixed = fix(text);
    if (fixed !== text) {
      e.clipboardData.setData('text/plain', fixed);
      e.preventDefault();
    }
  }, true);
})();
