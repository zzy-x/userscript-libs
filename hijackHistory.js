// hijackHistory.js (bitmask + debug)
(function () {
    'use strict';

    if (window.hijackHistory) return;

    // flag 定义
    window.HIJACK_FLAGS = {
        PUSH: 1 << 0,      // 1
        REPLACE: 1 << 1,   // 2
        POP: 1 << 2        // 4
    };

    /**
     * @param {Function} callback - 回调函数
     * @param {number} flags - bitmask 表示要劫持的事件，例：HIJACK_FLAGS.PUSH | HIJACK_FLAGS.POP
     * @param {boolean} debug - 是否输出调试信息
     * @returns {Function} restore 方法，用于恢复原始 history 方法
     */
    window.hijackHistory = function (callback, flags = 7, debug = true) {
        const pushState = !!(flags & HIJACK_FLAGS.PUSH);
        const replaceState = !!(flags & HIJACK_FLAGS.REPLACE);
        const popstate = !!(flags & HIJACK_FLAGS.POP);

        const original = {
            push: history.pushState,
            replace: history.replaceState
        };

        function wrap(fn, type) {
            return function (...args) {
                const ret = fn.apply(this, args);
                callback({
                    type,
                    args,
                    url: location.href
                });
                if (debug) console.log(`[hijackHistory] ${type} called`, args, 'URL:', location.href);
                return ret;
            };
        }

        if (pushState) history.pushState = wrap(original.push, 'pushState');
        if (replaceState) history.replaceState = wrap(original.replace, 'replaceState');

        // 劫持 popstate
        let popHandler = null;
        if (events.includes('popstate')) {
            popHandler = e => {
                callback({
                    type: 'popstate',
                    event: e,
                    url: location.href
                });
                if (debug) console.log('[hijackHistory] popstate event', e, 'URL:', location.href);
            };
            window.addEventListener('popstate', popHandler);
        }

        return () => {
            if (events.includes('pushState')) history.pushState = original.push;
            if (events.includes('replaceState')) history.replaceState = original.replace;
            if (popHandler) window.removeEventListener('popstate', popHandler);
            if (debug) console.log('[hijackHistory] restore original history methods');
        };
    };
})();
