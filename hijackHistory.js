// ==UserScript==
// @name         History 劫持工具（调试版）
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  劫持 pushState / replaceState / popstate 并输出信息
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (window.hijackHistory) return;

    window.hijackHistory = function (callback) {
        const originalPush = history.pushState;
        const originalReplace = history.replaceState;

        const wrap = fn => function (...args) {
            const ret = fn.apply(this, args);
            // 回调信息
            callback({
                type: fn.name,
                args: args,
                url: location.href
            });
            console.log(`[hijackHistory] ${fn.name} called`, args, 'URL:', location.href);
            return ret;
        };

        history.pushState = wrap(originalPush);
        history.replaceState = wrap(originalReplace);

        const popHandler = e => {
            callback({
                type: 'popstate',
                event: e,
                url: location.href
            });
            console.log('[hijackHistory] popstate event', e, 'URL:', location.href);
        };
        window.addEventListener('popstate', popHandler);

        // 返回 restore 函数，可取消劫持
        return () => {
            history.pushState = originalPush;
            history.replaceState = originalReplace;
            window.removeEventListener('popstate', popHandler);
            console.log('[hijackHistory] restore original history methods');
        };
    };
})();
