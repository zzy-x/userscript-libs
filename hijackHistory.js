// hijackHistory.js (configurable version)
// 劫持 history.pushState / replaceState / popstate
(function () {
    'use strict';

    if (window.hijackHistory) return;

    /**
     * @param {Function} callback - 回调函数，参数格式：
     *   { type: 'pushState' | 'replaceState' | 'popstate', args?: any[], event?: Event, url: string }
     * @param {Object} options - 控制要劫持的事件
     *   { pushState?: boolean, replaceState?: boolean, popstate?: boolean }
     */
    window.hijackHistory = function (callback, options = { pushState: true, replaceState: true, popstate: true }) {
        const { pushState, replaceState, popstate } = options;

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
                console.log(`[hijackHistory] ${type} called`, args, 'URL:', location.href);
                return ret;
            };
        }

        if (pushState) {
            history.pushState = wrap(original.push, 'pushState');
        }

        if (replaceState) {
            history.replaceState = wrap(original.replace, 'replaceState');
        }

        let popHandler = null;
        if (popstate) {
            popHandler = e => {
                callback({
                    type: 'popstate',
                    event: e,
                    url: location.href
                });
                console.log('[hijackHistory] popstate event', e, 'URL:', location.href);
            };
            window.addEventListener('popstate', popHandler);
        }

        // 提供 restore 方法，恢复原始方法
        return () => {
            if (pushState) history.pushState = original.push;
            if (replaceState) history.replaceState = original.replace;
            if (popHandler) window.removeEventListener('popstate', popHandler);
            console.log('[hijackHistory] restore original history methods');
        };
    };
})();
