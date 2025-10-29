(function (global) {
    'use strict';

    /**
     * hrefSanitizer 净化 a 标签的 href 或文本
     * @param {HTMLAnchorElement} el - 要处理的 a 标签元素
     * @param {string} attr - 属性类型，'href'、'text'、'[attr]' 或 '?param'
     * @param {string|null} transform - 转换规则，如 removeHash、removeParam、base64decode
     * @param {boolean} [DEBUG=false] - 是否输出调试信息
     */
    function hrefSanitizer(el, attr, transform, DEBUG = false) {
        if (!(el instanceof HTMLAnchorElement)) return;

        // 获取原始 URL 或文本
        let newUrl = null;
        if (attr === 'href') {
            newUrl = el.href;
        } else if (attr === 'text') {
            newUrl = el.textContent.trim();
        } else if (attr.startsWith('[')) {
            newUrl = el.getAttribute(attr.slice(1, -1));
        } else if (attr.startsWith('?')) {
            try {
                newUrl = new URL(el.href).searchParams.get(attr.slice(1));
            } catch {}
        }

        if (!newUrl) return;
        const originalUrl = newUrl;

        // 应用转换规则
        try {
            if (transform === 'removeHash') {
                const u = new URL(newUrl);
                u.hash = '';
                newUrl = u.toString();
            } else if (transform && transform.startsWith('removeParam')) {
                const u = new URL(newUrl);
                const parts = transform.split(':');
                if (parts.length > 1 && parts[1]) {
                    const paramSpec = parts[1];
                    if (paramSpec.startsWith('~')) {
                        // ~保留列表，删除其他参数
                        const keep = paramSpec.slice(1).split(',');
                        for (const key of Array.from(u.searchParams.keys())) {
                            if (!keep.includes(key)) u.searchParams.delete(key);
                        }
                    } else {
                        // 普通列表，删除指定参数
                        paramSpec.split(',').forEach(p => u.searchParams.delete(p));
                    }
                } else {
                    // removeParam 没指定参数，清空所有参数
                    u.search = '';
                }
                newUrl = u.toString();
            } else if (transform === 'base64decode') {
                // Base64 解码
                newUrl = atob(newUrl);
            }
        } catch (e) {
            if (DEBUG) console.warn('⚠️ hrefSanitizer error:', e, el);
        }

        // 应用修改后的 URL 回到元素
        if (/^https?:\/\//i.test(newUrl) && newUrl !== originalUrl) {
            el.href = newUrl;
            if (DEBUG) console.log('🔗 href sanitized:', originalUrl, '→', newUrl, el);
        } else if (DEBUG) {
            console.log('✅ href unchanged:', originalUrl);
        }
    }

    // 导出到全局
    global.hrefSanitizer = hrefSanitizer;

})(window);
