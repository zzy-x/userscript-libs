// hijackHistory.js (test 分支调试版)
// 劫持 history.pushState 和 popstate
(function () {
    'use strict';

    if (window.hijackHistory) return;

    window.hijackHistory = function (callback) {
        const originalPush = history.pushState;

        const wrap = fn => function (...args) {
            const ret = fn.apply(this, args);
            // 回调信息
            callback({
                type: fn.name,
                args: args,
                url: location.href
            });
            console.log(`[hijackHistory:test] ${fn.name} called`, args, 'URL:', location.href);
            return ret;
        };

        // 只劫持 pushState
        history.pushState = wrap(originalPush);

        // popstate 事件
        const popHandler = e => {
            callback({
                type: 'popstate',
                event: e,
                url: location.href
            });
            console.log('[hijackHistory:test] popstate event', e, 'URL:', location.href);
        };
        window.addEventListener('popstate', popHandler);

        // 返回 restore 函数，可取消劫持
        return () => {
            history.pushState = originalPush;
            window.removeEventListener('popstate', popHandler);
            console.log('[hijackHistory:test] restore original history methods');
        };
    };
})();
