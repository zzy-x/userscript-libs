(function () {
    'use strict';

    if (window.hijackHistory) return; // 防止重复加载

    /**
     * 通用 history 劫持函数（支持 push/replace/pop）
     * @param {Function} callback - 每次 push/replace/pop 触发时调用
     *                               可修改 push/replace 的 URL：args[2]
     * @param {Object} options
     * @param {Array<string>} options.flags - 劫持类型 ['PUSH','REPLACE','POP']，默认全部
     * @param {'before'|'after'} options.mode - push/replace 回调时机：
     *                                         'before' -> 修改 URL 后再跳转
     *                                         'after'  -> 跳转后回调
     * @param {boolean} debug - 是否输出调试日志，默认 false
     * @returns {Function} restore - 恢复原始 history 方法
     */
    window.hijackHistory = function (callback, options = {}, debug = false) {
        const {
            flags = ['PUSH', 'REPLACE', 'POP'],
            mode = 'after'
        } = options;

        // 简单日志封装
        const log = (...args) => debug && console.log('[hijackHistory]', ...args);

        // 判断是否劫持各类型
        const usePush = flags.includes('PUSH');
        const useReplace = flags.includes('REPLACE');
        const usePop = flags.includes('POP');

        // 保存原始方法，用于 restore
        const original = { push: history.pushState, replace: history.replaceState };
        let lastUrl = location.href; // 上一次 URL，用于 POP 事件

        // 包装 push/replace 方法
        function wrap(fn, type) {
            return function (...args) {
                const oldUrl = lastUrl; // 跳转前 URL

                // 前置回调：可修改 args[2] 改 URL
                if (mode === 'before') callback({ type, oldUrl, args });

                // 调用原始方法
                const ret = fn.apply(this, args);
                const newUrl = location.href; // 跳转后的 URL
                lastUrl = newUrl;

                // 后置回调：跳转后触发
                if (mode === 'after') callback({ type, oldUrl, newUrl, args });

                log(type, { oldUrl, newUrl });
                return ret; // 返回原方法返回值
            };
        }

        // 劫持 pushState / replaceState
        if (usePush) history.pushState = wrap(original.push, 'pushState');
        if (useReplace) history.replaceState = wrap(original.replace, 'replaceState');

        // POP 固定后置处理
        let popHandler = null;
        if (usePop) {
            popHandler = e => {
                const oldUrl = lastUrl;
                const newUrl = location.href;
                lastUrl = newUrl;
                // POP 回调
                callback({ type: 'popstate', oldUrl, newUrl, args: [], event: e });
                log('popstate', { oldUrl, newUrl });
            };
            window.addEventListener('popstate', popHandler);
        }

        // restore 方法：恢复原始 history
        return () => {
            if (usePush) history.pushState = original.push;
            if (useReplace) history.replaceState = original.replace;
            if (usePop) window.removeEventListener('popstate', popHandler);
            log('restore original');
        };
    };
})();
