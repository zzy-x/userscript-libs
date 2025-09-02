// hijackHistory.js
// 通用工具：劫持 history.pushState 和 popstate 事件
// 不会拦截 replaceState（可安全用于 URL 清理）

(function () {
    'use strict';

    if (window.hijackHistory) return;

    /**
     * 劫持 history.pushState 和 popstate
     * @param {Function} callback 回调函数，接收参数 { type, args, url, event? }
     * @returns {Function} restore 函数，用于恢复原始行为
     */
    window.hijackHistory = function (callback) {
        const originalPush = history.pushState;

        // 只劫持 pushState
        history.pushState = function (...args) {
            const ret = originalPush.apply(this, args);
            try {
                callback({
                    type: 'pushState',
                    args,
                    url: location.href
                });
            } catch (err) {
                console.error('[hijackHistory] pushState callback error:', err);
            }
            return ret;
        };

        // 劫持 popstate 事件
        const popHandler = e => {
            try {
                callback({
                    type: 'popstate',
                    event: e,
                    url: location.href
                });
            } catch (err) {
                console.error('[hijackHistory] popstate callback error:', err);
            }
        };
        window.addEventListener('popstate', popHandler);

        // 提供 restore 函数
        return () => {
            history.pushState = originalPush;
            window.removeEventListener('popstate', popHandler);
            console.log('[hijackHistory] restored original history methods');
        };
    };
})();
