// ==UserScript==
// @name         hijackHistory.js
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  劫持 history.pushState / replaceState / popstate，可简写事件列表
// @author       ChatGPT
// ==/UserScript==

(function () {
    'use strict';

    if (window.hijackHistory) return;

    /**
     * @param {Function} callback - 回调函数，参数格式：
     *   { type: 'pushState' | 'replaceState' | 'popstate', args?: any[], event?: Event, url: string }
     * @param {Array<string>} events - 要劫持的事件列表，可包含 'pushState' / 'replaceState' / 'popstate'
     *                                 默认空数组（不劫持任何事件）
     * @returns {Function} restore 方法，可恢复原始 history 方法
     */
    window.hijackHistory = function (callback, events = []) {
        const original = {
            push: history.pushState,
            replace: history.replaceState
        };

        const wrap = (fn, type) => function (...args) {
            const ret = fn.apply(this, args);
            callback({ type, args, url: location.href });
            console.log(`[hijackHistory] ${type} called`, args, 'URL:', location.href);
            return ret;
        };

        // 劫持 pushState / replaceState
        if (events.includes('pushState')) history.pushState = wrap(original.push, 'pushState');
        if (events.includes('replaceState')) history.replaceState = wrap(original.replace, 'replaceState');

        // 劫持 popstate
        let popHandler = null;
        if (events.includes('popstate')) {
            popHandler = e => {
                callback({ type: 'popstate', event: e, url: location.href });
                console.log('[hijackHistory] popstate event', e, 'URL:', location.href);
            };
            window.addEventListener('popstate', popHandler);
        }

        // 返回 restore 方法
        return () => {
            if (events.includes('pushState')) history.pushState = original.push;
            if (events.includes('replaceState')) history.replaceState = original.replace;
            if (popHandler) window.removeEventListener('popstate', popHandler);
            console.log('[hijackHistory] restore original history methods');
        };
    };
})();
