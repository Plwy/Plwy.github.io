const CACHE_BUSTER = "20260510a";
const ARTICLE_REPO_BASE = "https://raw.githubusercontent.com/Plwy/plwy-articles/main";
const DEFAULT_OG_IMAGE = "https://plwy.github.io/images/hero-bg.jpg";
const HOME_PAGE_SIZE = 8;
const CATEGORY_PAGE_SIZE = 10;
const SIDEBAR_LATEST_COUNT = 5;
const VIEW_COUNTER_NAMESPACE = "plwy-github-io";
const PRISM_LIGHT_THEME = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css";
const PRISM_DARK_THEME = "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css";

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function getPublicBaseUrl() {
    return window.location.protocol === "file:" ? "https://plwy.github.io" : window.location.origin;
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function resolveAssetUrl(path, assetBase = ARTICLE_REPO_BASE) {
    if (!path) return "";
    if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
    if (path.startsWith("#")) return path;
    const trimmedBase = assetBase.replace(/\/$/, "");
    const normalizedPath = path.replace(/^\.\//, "").replace(/^\//, "");
    return `${trimmedBase}/${normalizedPath}`;
}

function setMetaContent(selector, key, value) {
    if (!value) return;
    let tag = document.head.querySelector(selector);
    if (!tag) {
        tag = document.createElement("meta");
        const match = selector.match(/"(.*?)"/);
        if (match) tag.setAttribute(key, match[1]);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", value);
}

function updateSeoMeta({ title, description, url, type = "website", image = DEFAULT_OG_IMAGE }) {
    if (title) {
        document.title = title;
        setMetaContent('meta[property="og:title"]', "property", title);
    }
    if (description) {
        setMetaContent('meta[name="description"]', "name", description);
        setMetaContent('meta[property="og:description"]', "property", description);
    }
    setMetaContent('meta[property="og:type"]', "property", type);
    setMetaContent('meta[property="og:url"]', "property", url || window.location.href);
    setMetaContent('meta[property="og:image"]', "property", image);
}

function syncPrismTheme() {
    const link = document.getElementById("prism-theme");
    if (!link) return;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    link.href = dark ? PRISM_DARK_THEME : PRISM_LIGHT_THEME;
}

function setupThemeToggle() {
    const root = document.documentElement;
    const button = document.getElementById("theme-toggle");

    if (localStorage.getItem("theme") === "dark") {
        root.setAttribute("data-theme", "dark");
    }

    const syncButton = () => {
        const dark = root.getAttribute("data-theme") === "dark";
        if (button) {
            button.textContent = dark ? "☀" : "◐";
            button.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
        }
        syncPrismTheme();
    };

    if (button) {
        button.addEventListener("click", () => {
            const dark = root.getAttribute("data-theme") === "dark";
            if (dark) {
                root.removeAttribute("data-theme");
                localStorage.setItem("theme", "light");
            } else {
                root.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
            }
            syncButton();
        });
    }

    syncButton();
}

async function loadSiteData() {
    const [postsResponse, categoriesResponse] = await Promise.all([
        fetch(`${ARTICLE_REPO_BASE}/posts.json?v=${CACHE_BUSTER}`, { cache: "no-store" }),
        fetch(`${ARTICLE_REPO_BASE}/categories.json?v=${CACHE_BUSTER}`, { cache: "no-store" })
    ]);

    if (!postsResponse.ok) throw new Error("无法读取文章索引。");
    if (!categoriesResponse.ok) throw new Error("无法读取分类索引。");

    return {
        posts: await postsResponse.json(),
        categories: await categoriesResponse.json()
    };
}

function sortPosts(posts) {
    return posts.slice().sort((a, b) => {
        const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
        return dateCompare || String(a.slug || "").localeCompare(String(b.slug || ""));
    });
}

function extractTags(posts) {
    return [...new Set(posts.flatMap((post) => post.tags || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function paginatePosts(posts, currentPage, pageSize) {
    const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
        page: safePage,
        totalPages,
        items: posts.slice(start, start + pageSize)
    };
}

function buildCategorySummary(posts, categories) {
    const summary = {};
    categories.forEach((category) => {
        summary[category.slug] = { ...category, count: 0 };
    });
    posts.forEach((post) => {
        if (summary[post.category.slug]) {
            summary[post.category.slug].count += 1;
        }
    });
    return Object.values(summary);
}

function matchesCategory(category, query) {
    if (!query) return true;
    return [category.name, category.slug, category.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
}

function matchesPost(post, query) {
    if (!query) return true;
    return [
        post.title,
        post.excerpt,
        post.category?.name,
        post.category?.slug,
        ...(post.tags || [])
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
}

function renderTagLinks(tags, { linked = true } = {}) {
    if (!tags?.length) return "";
    return `
        <div class="tag-list">
            ${tags.map((tag) => linked
                ? `<a class="tag tag-link" href="tag.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`
                : `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
    `;
}

function renderInlineTagLinks(tags) {
    if (!tags?.length) return "未设置";
    return tags.map((tag) => `<a class="tag-link" href="tag.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join(" ");
}

function renderPostList(posts, options = {}) {
    const { showTags = true } = options;
    return posts.map((post) => `
        <a class="post-card" href="article.html?slug=${encodeURIComponent(post.slug)}">
            <div class="card-meta">${escapeHtml(post.date || "")} · ${escapeHtml(post.category?.name || "")}</div>
            <h3>${escapeHtml(post.title || "未命名文章")}${post.featured ? '<span class="featured-badge">置顶</span>' : ""}</h3>
            <p>${escapeHtml(post.excerpt || "")}</p>
            ${showTags ? renderTagLinks(post.tags) : ""}
        </a>
    `).join("");
}

function renderPinnedPostList(posts) {
    return posts.map((post) => `
        <a class="post-card" href="article.html?slug=${encodeURIComponent(post.slug)}">
            <div class="card-meta">${escapeHtml(post.date || "")} · ${escapeHtml(post.category?.name || "")}</div>
            <h3>${escapeHtml(post.title || "未命名文章")}<span class="featured-badge">置顶</span></h3>
            <p>${escapeHtml(post.excerpt || "")}</p>
        </a>
    `).join("");
}

function renderTagTabs(container, tags, activeTag) {
    if (!container) return;
    const allTags = ["全部", ...tags];
    container.innerHTML = allTags.map((tag) => {
        const value = tag === "全部" ? "all" : tag;
        return `<button class="tag-tab${value === activeTag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(value)}">${escapeHtml(tag)}</button>`;
    }).join("");
}

function renderPager(container, currentPage, totalPages) {
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const buttons = [];
    for (let page = 1; page <= totalPages; page += 1) {
        buttons.push(`<button class="pagination-button${page === currentPage ? " is-active" : ""}" type="button" data-page="${page}">${page}</button>`);
    }

    container.innerHTML = `
        <button class="pagination-button" type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>上一页</button>
        ${buttons.join("")}
        <button class="pagination-button" type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>下一页</button>
    `;
}

function setupSearch(inputId, onFilter) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const applyFilter = () => onFilter(input.value.trim().toLowerCase());
    input.addEventListener("input", applyFilter);
    applyFilter();
}

function setupCategoryScroll() {
    const categoryGrid = document.getElementById("category-grid");
    const prevButton = document.getElementById("category-prev");
    const nextButton = document.getElementById("category-next");
    if (!categoryGrid || !prevButton || !nextButton) return;

    const updateButtons = () => {
        prevButton.disabled = categoryGrid.scrollLeft <= 0;
        nextButton.disabled = categoryGrid.scrollLeft >= categoryGrid.scrollWidth - categoryGrid.clientWidth - 10;
    };

    prevButton.onclick = () => {
        categoryGrid.scrollBy({ left: -520, behavior: "smooth" });
        window.setTimeout(updateButtons, 120);
    };

    nextButton.onclick = () => {
        categoryGrid.scrollBy({ left: 520, behavior: "smooth" });
        window.setTimeout(updateButtons, 120);
    };

    categoryGrid.addEventListener("scroll", updateButtons);
    updateButtons();
}

function renderFeatured(posts) {
    const section = document.getElementById("featured");
    const container = document.getElementById("featured-posts");
    if (!section || !container) return;

    const featuredPosts = sortPosts(posts.filter((post) => post.featured)).slice(0, 6);
    if (!featuredPosts.length) {
        section.style.display = "none";
        return;
    }

    section.style.display = "";
    container.innerHTML = renderPinnedPostList(featuredPosts);
}

function slugifyHeading(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
        .replace(/\s+/g, "-");
}

function normalizeLanguage(language) {
    if (!language) return "text";
    const normalized = String(language).trim().toLowerCase();
    const aliases = {
        "c++": "cpp",
        cc: "cpp",
        py: "python",
        js: "javascript",
        ts: "typescript",
        sh: "bash",
        shell: "bash"
    };
    return aliases[normalized] || normalized;
}

function prettyLanguageLabel(language) {
    const labels = {
        cpp: "C++",
        c: "C",
        python: "Python",
        javascript: "JavaScript",
        typescript: "TypeScript",
        bash: "Bash",
        json: "JSON",
        yaml: "YAML",
        markdown: "Markdown",
        text: "Text"
    };
    return labels[language] || language.toUpperCase();
}

function markdownToHtml(markdown, assetBase = ARTICLE_REPO_BASE) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inList = false;
    let listType = "";
    let inCode = false;
    let codeLanguage = "text";

    const closeList = () => {
        if (inList) {
            html.push(`</${listType}>`);
            inList = false;
            listType = "";
        }
    };

    const renderInline = (text) => escapeHtml(text)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, path) => `<img src="${resolveAssetUrl(path, assetBase)}" alt="${escapeHtml(alt)}">`)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, path) => `<a href="${resolveAssetUrl(path, assetBase)}">${escapeHtml(label)}</a>`)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();

        if (line.startsWith("```")) {
            closeList();
            if (!inCode) {
                inCode = true;
                codeLanguage = normalizeLanguage(line.slice(3).trim());
                html.push(`<pre class="language-${codeLanguage}"><code class="language-${codeLanguage}">`);
            } else {
                inCode = false;
                codeLanguage = "text";
                html.push("</code></pre>");
            }
            continue;
        }

        if (inCode) {
            html.push(`${escapeHtml(rawLine)}\n`);
            continue;
        }

        if (!line.trim()) {
            closeList();
            continue;
        }

        if (line.startsWith("### ")) {
            closeList();
            html.push(`<h3>${renderInline(line.slice(4))}</h3>`);
            continue;
        }

        if (line.startsWith("## ")) {
            closeList();
            html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
            continue;
        }

        if (line.startsWith("# ")) {
            closeList();
            html.push(`<h1>${renderInline(line.slice(2))}</h1>`);
            continue;
        }

        if (/^- /.test(line)) {
            if (!inList || listType !== "ul") {
                closeList();
                inList = true;
                listType = "ul";
                html.push("<ul>");
            }
            html.push(`<li>${renderInline(line.slice(2))}</li>`);
            continue;
        }

        if (/^\d+\.\s/.test(line)) {
            if (!inList || listType !== "ol") {
                closeList();
                inList = true;
                listType = "ol";
                html.push("<ol>");
            }
            html.push(`<li>${renderInline(line.replace(/^\d+\.\s/, ""))}</li>`);
            continue;
        }

        closeList();
        html.push(`<p>${renderInline(line)}</p>`);
    }

    closeList();
    return html.join("");
}

function rewriteRenderedAssets(container, assetBase) {
    container.querySelectorAll("img[src]").forEach((image) => {
        image.src = resolveAssetUrl(image.getAttribute("src") || "", assetBase);
    });

    container.querySelectorAll("a[href]").forEach((link) => {
        const href = link.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;
        const resolved = resolveAssetUrl(href, assetBase);
        link.setAttribute("href", resolved);
        if (/^https?:\/\//i.test(resolved)) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noreferrer");
        }
    });
}

function renderMath(container) {
    if (!window.renderMathInElement || !container) return;
    window.renderMathInElement(container, {
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
    });
}

function renderMarkdownArticle(markdown) {
    const normalizedMarkdown = markdown.replace(/^\[TOC\]\s*$/gim, "").trim();
    if (!window.marked) {
        return markdownToHtml(normalizedMarkdown);
    }

    const renderer = new window.marked.Renderer();
    renderer.heading = ({ tokens, depth }) => {
        const text = (tokens || []).map((token) => token.text || "").join("").trim();
        const id = slugifyHeading(text) || `section-${depth}`;
        return `<h${depth} id="${id}">${window.marked.Parser.parseInline(tokens)}</h${depth}>`;
    };

    const rawHtml = window.marked.parse(normalizedMarkdown, {
        gfm: true,
        breaks: true,
        headerIds: true,
        mangle: false,
        renderer
    });

    return window.DOMPurify ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
}

function enhanceCodeBlocks(container) {
    const blocks = container.querySelectorAll("pre > code");
    blocks.forEach((code) => {
        const pre = code.parentElement;
        if (!pre || pre.parentElement?.classList.contains("code-block")) return;

        const languageClass = [...code.classList].find((item) => item.startsWith("language-"));
        const language = languageClass ? languageClass.replace("language-", "") : "text";

        const wrapper = document.createElement("div");
        wrapper.className = "code-block";

        const toolbar = document.createElement("div");
        toolbar.className = "code-toolbar";

        const label = document.createElement("span");
        label.className = "code-language";
        label.textContent = prettyLanguageLabel(language);

        const button = document.createElement("button");
        button.className = "code-copy-button";
        button.type = "button";
        button.textContent = "复制";
        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code.textContent || "");
                button.textContent = "已复制";
                window.setTimeout(() => { button.textContent = "复制"; }, 1400);
            } catch {
                button.textContent = "复制失败";
                window.setTimeout(() => { button.textContent = "复制"; }, 1400);
            }
        });

        toolbar.append(label, button);
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.append(toolbar, pre);
    });
}

function buildArticleOutline(container) {
    const outline = document.getElementById("article-outline");
    if (!outline) return;

    const headings = [...container.querySelectorAll("h2, h3")];
    if (!headings.length) {
        outline.innerHTML = "<li>这篇文章暂时没有二级或三级标题。</li>";
        return;
    }

    const usedIds = new Set();
    headings.forEach((heading, index) => {
        let id = heading.id || slugifyHeading(heading.textContent || "") || `section-${index + 1}`;
        while (usedIds.has(id)) {
            id = `${id}-${index + 1}`;
        }
        usedIds.add(id);
        heading.id = id;
    });

    outline.innerHTML = headings.map((heading) => {
        const level = Number(heading.tagName.slice(1));
        return `<li class="outline-level-${level}"><a href="#${heading.id}">${escapeHtml(heading.textContent || "")}</a></li>`;
    }).join("");
}

function renderArticlePagination(posts, currentIndex) {
    const pagination = document.getElementById("article-pagination");
    if (!pagination) return;

    const newer = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const older = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

    pagination.innerHTML = `
        ${newer ? `<a class="article-nav-card" href="article.html?slug=${encodeURIComponent(newer.slug)}"><span class="article-nav-label">上一篇</span><strong>${escapeHtml(newer.title)}</strong></a>` : '<span class="article-nav-card is-empty"></span>'}
        ${older ? `<a class="article-nav-card article-nav-card-right" href="article.html?slug=${encodeURIComponent(older.slug)}"><span class="article-nav-label">下一篇</span><strong>${escapeHtml(older.title)}</strong></a>` : '<span class="article-nav-card is-empty"></span>'}
    `;
}

function setupBackToTop() {
    const button = document.getElementById("back-to-top");
    if (!button) return;

    const sync = () => {
        button.classList.toggle("is-visible", window.scrollY > 320);
    };

    button.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", sync, { passive: true });
    sync();
}

async function incrementViewCount(slug) {
    const localKey = `plwy:view:${slug}`;
    try {
        const response = await fetch(`https://api.countapi.xyz/hit/${encodeURIComponent(VIEW_COUNTER_NAMESPACE)}/${encodeURIComponent(slug)}`, {
            cache: "no-store"
        });
        if (!response.ok) throw new Error("remote counter failed");
        const payload = await response.json();
        return Number(payload.value || 0);
    } catch {
        const next = Number(localStorage.getItem(localKey) || "0") + 1;
        localStorage.setItem(localKey, String(next));
        return next;
    }
}

function renderShareActions(post, articleUrl) {
    const container = document.getElementById("share-actions");
    if (!container) return;

    const text = encodeURIComponent(`${post.title} | 侧耳倾听`);
    const url = encodeURIComponent(articleUrl);
    const actions = [
        { label: "微博", icon: "微", className: "is-weibo", href: `https://service.weibo.com/share/share.php?title=${text}&url=${url}` },
        { label: "X", icon: "𝕏", className: "is-x", href: `https://twitter.com/intent/tweet?text=${text}&url=${url}` },
        { label: "Telegram", icon: "✈", className: "is-telegram", href: `https://t.me/share/url?url=${url}&text=${text}` },
        { label: "LinkedIn", icon: "in", className: "is-linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` }
    ];

    container.innerHTML = actions.map((action) => `
        <a class="share-button ${action.className}" href="${action.href}" target="_blank" rel="noreferrer" aria-label="${action.label}" title="${action.label}">
            <span class="share-icon">${action.icon}</span>
        </a>
    `).join("") + '<button class="share-button share-button-copy" id="copy-article-link" type="button" aria-label="复制链接" title="复制链接"><span class="share-icon">⧉</span></button>';

    const copyButton = document.getElementById("copy-article-link");
    copyButton?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(articleUrl);
            copyButton.innerHTML = '<span class="share-icon">✓</span>';
            window.setTimeout(() => { copyButton.innerHTML = '<span class="share-icon">⧉</span>'; }, 1400);
        } catch {
            copyButton.innerHTML = '<span class="share-icon">!</span>';
            window.setTimeout(() => { copyButton.innerHTML = '<span class="share-icon">⧉</span>'; }, 1400);
        }
    });
}

function renderHome(posts, categories) {
    const categoryGrid = document.getElementById("category-grid");
    const latestPosts = document.getElementById("latest-posts");
    const tagTabs = document.getElementById("home-tag-tabs");
    const pagination = document.getElementById("home-pagination");
    const allCategories = buildCategorySummary(posts, categories);
    const allPosts = sortPosts(posts);
    let activeTag = "all";
    let currentPage = 1;

    renderFeatured(allPosts);

    const renderFiltered = (query) => {
        const filteredCategories = allCategories.filter((category) => matchesCategory(category, query));
        const queryPosts = allPosts.filter((post) => matchesPost(post, query));
        const tags = extractTags(queryPosts);
        if (activeTag !== "all" && !tags.includes(activeTag)) {
            activeTag = "all";
        }

        const filteredPosts = activeTag === "all"
            ? queryPosts
            : queryPosts.filter((post) => (post.tags || []).includes(activeTag));
        const paged = paginatePosts(filteredPosts, currentPage, HOME_PAGE_SIZE);
        currentPage = paged.page;

        if (categoryGrid) {
            categoryGrid.innerHTML = filteredCategories.length
                ? filteredCategories.map((category) => `
                    <a class="category-card" href="category.html?slug=${encodeURIComponent(category.slug)}">
                        <div class="category-icon">${escapeHtml(category.icon || "·")}</div>
                        <h3>${escapeHtml(category.name)}</h3>
                        <p>${escapeHtml(category.description || "")}</p>
                        <p class="card-meta">${category.count} 篇文章</p>
                    </a>
                `).join("")
                : '<div class="empty-state">没有匹配到分类结果。</div>';
            setupCategoryScroll();
        }

        renderTagTabs(tagTabs, tags, activeTag);
        renderPager(pagination, paged.page, paged.totalPages);
        latestPosts.innerHTML = filteredPosts.length
            ? renderPostList(paged.items)
            : '<div class="empty-state">没有匹配到文章结果。</div>';
    };

    tagTabs?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-tag]");
        if (!button) return;
        activeTag = button.dataset.tag || "all";
        currentPage = 1;
        renderFiltered(document.getElementById("home-search")?.value.trim().toLowerCase() || "");
    });

    pagination?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;
        currentPage = Number(button.dataset.page || "1");
        renderFiltered(document.getElementById("home-search")?.value.trim().toLowerCase() || "");
    });

    setupSearch("home-search", (query) => {
        currentPage = 1;
        renderFiltered(query);
    });
}

function renderCategory(posts, categories) {
    const slug = getQueryParam("slug");
    const categoryPosts = sortPosts(posts.filter((post) => post.category.slug === slug));
    const title = document.getElementById("category-title");
    const breadcrumb = document.getElementById("category-breadcrumb");
    const list = document.getElementById("category-posts");
    const tagTabs = document.getElementById("category-tag-tabs");
    const pagination = document.getElementById("category-pagination");
    const category = categories.find((item) => item.slug === slug);
    let activeTag = "all";
    let currentPage = 1;

    if (!category) {
        if (title) title.textContent = "未找到这个分类";
        if (list) list.innerHTML = '<div class="empty-state">这个分类暂时没有文章。</div>';
        updateSeoMeta({
            title: "未找到分类 | 侧耳倾听",
            description: "未找到对应的分类页面。",
            url: window.location.href
        });
        return;
    }

    if (title) title.textContent = category.name;
    if (breadcrumb) breadcrumb.textContent = category.name;
    updateSeoMeta({
        title: `${category.name} | 侧耳倾听`,
        description: category.description || `查看 ${category.name} 分类下的文章列表。`,
        url: window.location.href
    });

    const renderFiltered = (query) => {
        const queryPosts = categoryPosts.filter((post) => matchesPost(post, query));
        const tags = extractTags(queryPosts);
        if (activeTag !== "all" && !tags.includes(activeTag)) {
            activeTag = "all";
        }
        const filtered = activeTag === "all"
            ? queryPosts
            : queryPosts.filter((post) => (post.tags || []).includes(activeTag));
        const paged = paginatePosts(filtered, currentPage, CATEGORY_PAGE_SIZE);
        currentPage = paged.page;

        renderTagTabs(tagTabs, tags, activeTag);
        renderPager(pagination, paged.page, paged.totalPages);
        list.innerHTML = filtered.length
            ? renderPostList(paged.items)
            : '<div class="empty-state">这个分类下没有匹配到文章。</div>';
    };

    tagTabs?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-tag]");
        if (!button) return;
        activeTag = button.dataset.tag || "all";
        currentPage = 1;
        renderFiltered(document.getElementById("category-search")?.value.trim().toLowerCase() || "");
    });

    pagination?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;
        currentPage = Number(button.dataset.page || "1");
        renderFiltered(document.getElementById("category-search")?.value.trim().toLowerCase() || "");
    });

    setupSearch("category-search", (query) => {
        currentPage = 1;
        renderFiltered(query);
    });
}

function renderTag(posts) {
    const tag = getQueryParam("tag");
    const title = document.getElementById("tag-title");
    const breadcrumb = document.getElementById("tag-breadcrumb");
    const list = document.getElementById("tag-posts");
    const searchInput = document.getElementById("tag-search");
    const pagination = document.getElementById("tag-pagination");

    if (!tag) {
        if (title) title.textContent = "未指定标签";
        if (list) list.innerHTML = '<div class="empty-state">请指定要查看的标签。</div>';
        updateSeoMeta({
            title: "标签 | 侧耳倾听",
            description: "查看标签下的文章列表。",
            url: window.location.href
        });
        return;
    }

    const taggedPosts = sortPosts(posts.filter((post) => (post.tags || []).includes(tag)));
    if (title) title.textContent = `#${tag}`;
    if (breadcrumb) breadcrumb.textContent = `#${tag}`;

    updateSeoMeta({
        title: `#${tag} | 侧耳倾听`,
        description: `查看标签“${tag}”下的 ${taggedPosts.length} 篇文章。`,
        url: window.location.href
    });

    let currentPage = 1;

    const renderFiltered = (query) => {
        const queryPosts = taggedPosts.filter((post) => matchesPost(post, query));
        const paged = paginatePosts(queryPosts, currentPage, CATEGORY_PAGE_SIZE);
        currentPage = paged.page;

        if (list) {
            list.innerHTML = queryPosts.length
                ? renderPostList(paged.items, { showTags: false })
                : '<div class="empty-state">这个标签下没有匹配到文章。</div>';
        }
        renderPager(pagination, paged.page, paged.totalPages);
    };

    pagination?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;
        currentPage = Number(button.dataset.page || "1");
        renderFiltered(searchInput?.value.trim().toLowerCase() || "");
    });

    setupSearch("tag-search", (query) => {
        currentPage = 1;
        renderFiltered(query);
    });
}

async function renderArticle(posts) {
    const orderedPosts = sortPosts(posts);
    const slug = getQueryParam("slug");
    const currentIndex = orderedPosts.findIndex((item) => item.slug === slug);
    const post = currentIndex >= 0 ? orderedPosts[currentIndex] : null;
    const body = document.getElementById("article-body");

    if (!post || !body) {
        document.getElementById("article-title").textContent = "未找到这篇文章";
        if (body) body.innerHTML = "<p>可以返回首页重新选择文章。</p>";
        updateSeoMeta({
            title: "未找到文章 | 侧耳倾听",
            description: "未找到对应的文章内容。",
            url: window.location.href,
            type: "article"
        });
        return;
    }

    document.getElementById("article-title").textContent = post.title;
    document.getElementById("article-title-breadcrumb").textContent = post.title;
    document.getElementById("article-meta").textContent = `${post.date} · ${post.category.name}`;

    const categoryLink = document.getElementById("article-category-link");
    if (categoryLink) {
        categoryLink.textContent = post.category.name;
        categoryLink.href = `category.html?slug=${encodeURIComponent(post.category.slug)}`;
    }

    const articleUrl = `${getPublicBaseUrl()}/article.html?slug=${encodeURIComponent(post.slug)}`;
    const articleUrlElement = document.getElementById("article-url");
    if (articleUrlElement) {
        articleUrlElement.href = articleUrl;
        articleUrlElement.textContent = articleUrl;
    }

    const articleInfo = document.getElementById("article-info");
    if (articleInfo) {
        articleInfo.innerHTML = `
            <li>分类：${escapeHtml(post.category.name)}</li>
            <li>日期：${escapeHtml(post.date || "")}</li>
            <li>标签：${renderInlineTagLinks(post.tags)}</li>
            <li>置顶：${post.featured ? "是" : "否"}</li>
        `;
    }

    const tagsFooter = document.getElementById("article-tags-footer");
    if (tagsFooter) {
        tagsFooter.innerHTML = post.tags?.length
            ? `<div class="article-tags-title">标签</div>${renderTagLinks(post.tags)}`
            : "";
    }

    const latestPostsMini = document.getElementById("latest-posts-mini");
    if (latestPostsMini) {
        latestPostsMini.innerHTML = orderedPosts.slice(0, SIDEBAR_LATEST_COUNT).map((item) => `
            <li><a href="article.html?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a></li>
        `).join("");
    }

    const relatedPosts = orderedPosts
        .filter((item) => item.category.slug === post.category.slug && item.slug !== post.slug)
        .slice(0, 5);
    const relatedContainer = document.getElementById("related-posts");
    if (relatedContainer) {
        relatedContainer.innerHTML = relatedPosts.length
            ? relatedPosts.map((item) => `<li><a href="article.html?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a></li>`).join("")
            : "<li>这个分类下暂时没有更多文章。</li>";
    }

    const response = await fetch(`${ARTICLE_REPO_BASE}/${post.markdown}?v=${CACHE_BUSTER}`, { cache: "no-store" });
    if (!response.ok) {
        body.innerHTML = "<p>Markdown 正文读取失败。</p>";
        return;
    }

    const markdown = await response.text();
    const markdownBase = `${ARTICLE_REPO_BASE}/${post.markdown.substring(0, post.markdown.lastIndexOf("/"))}`;
    body.innerHTML = renderMarkdownArticle(markdown);
    rewriteRenderedAssets(body, markdownBase);
    renderMath(body);
    enhanceCodeBlocks(body);
    if (window.Prism?.highlightAllUnder) {
        window.Prism.highlightAllUnder(body);
    }
    buildArticleOutline(body);
    renderArticlePagination(orderedPosts, currentIndex);
    renderShareActions(post, articleUrl);

    const viewCount = await incrementViewCount(post.slug);
    const viewCountElement = document.getElementById("article-view-count");
    if (viewCountElement) {
        viewCountElement.textContent = String(viewCount);
    }

    updateSeoMeta({
        title: `${post.title} | 侧耳倾听`,
        description: post.excerpt || `阅读 ${post.title}`,
        url: window.location.href,
        type: "article"
    });
}

async function init() {
    setupThemeToggle();
    setupBackToTop();

    try {
        const page = document.body.dataset.page;
        if (!page) return;

        const { posts, categories } = await loadSiteData();
        if (page === "home") renderHome(posts, categories);
        if (page === "category") renderCategory(posts, categories);
        if (page === "tag") renderTag(posts);
        if (page === "article") await renderArticle(posts);
    } catch (error) {
        const fallback = document.createElement("div");
        fallback.className = "container";
        fallback.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "页面加载失败。")}</div>`;
        document.body.appendChild(fallback);
    }
}

init();
