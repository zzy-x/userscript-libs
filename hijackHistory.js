(function () {
    'use strict';

    if (window.hijackHistory) return; // 防止重复加载

    // 劫持标志位
    window.HIJACK_FLAGS = {
        PUSH: 1 << 0,    // pushState
        REPLACE: 1 << 1, // replaceState
        POP: 1 << 2      // popstate
    };

    /**
     * 通用 history 劫持函数
     * 自动提供 oldUrl/newUrl，包括 POP 事件
     * @param {Function} callback - 每次 push/replace/pop 调用时触发
     * @param {number} flags - HIJACK_FLAGS 组合（默认 7，全劫持）
     * @param {boolean} debug - 是否输出调试信息
     * @returns {Function} restore - 恢复原始 history 方法
     */
    window.hijackHistory = function (callback, flags = 7, debug = false) {

        // 简单 log 封装
        const log = (...args) => debug && console.log('[hijackHistory]', ...args);

        const usePush = !!(flags & HIJACK_FLAGS.PUSH);
        const useReplace = !!(flags & HIJACK_FLAGS.REPLACE);
        const usePop = !!(flags & HIJACK_FLAGS.POP);

        const original = { push: history.pushState, replace: history.replaceState };

        let lastUrl = location.href; // 维护上一条 URL，用于 POP 也能获取 oldUrl

        // 包装 push/replace 方法
        function wrap(fn, type) {
            return function (...args) {
                const oldUrl = lastUrl;           // 离开页面 URL
                const ret = fn.apply(this, args); // 调用原始 push/replace
                const newUrl = location.href;     // 跳转后的 URL

                lastUrl = newUrl;                 // 更新上一条 URL
                callback({ type, args, oldUrl, newUrl });
                log(type, { oldUrl, newUrl });

                return ret; // 保持原方法返回值
            };
        }

        if (usePush) history.pushState = wrap(original.push, 'pushState');
        if (useReplace) history.replaceState = wrap(original.replace, 'replaceState');

        // POP 事件处理
        let popHandler = null;
        if (usePop) {
            popHandler = e => {
                const oldUrl = lastUrl;          // 上一次 URL
                const newUrl = location.href;    // 当前 URL

                lastUrl = newUrl;                // 更新上一条 URL
                callback({ type: 'popstate', event: e, oldUrl, newUrl });
                log('popstate', { oldUrl, newUrl });
            };
            window.addEventListener('popstate', popHandler);
        }

        // restore 方法，恢复原始 history 方法
        return () => {
            if (usePush) history.pushState = original.push;
            if (useReplace) history.replaceState = original.replace;
            if (usePop) window.removeEventListener('popstate', popHandler);
            log('restore original');
        };
    };
})();
