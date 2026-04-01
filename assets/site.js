const CACHE_BUSTER = "20260402a";
const ARTICLE_REPO_BASE = "https://raw.githubusercontent.com/Plwy/plwy-articles/main";
const DEFAULT_OG_IMAGE = "https://plwy.github.io/images/hero-bg.jpg";

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function parseInlineMarkdown(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function setMetaContent(selector, key, value) {
    if (!value) return;
    let tag = document.head.querySelector(selector);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(key, selector.match(/"(.*?)"/)[1]);
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

function setupThemeToggle() {
    const root = document.documentElement;
    const button = document.getElementById("theme-toggle");

    if (localStorage.getItem("theme") === "dark") {
        root.setAttribute("data-theme", "dark");
    }

    if (!button) return;

    const syncButton = () => {
        const dark = root.getAttribute("data-theme") === "dark";
        button.textContent = dark ? "☀" : "◐";
        button.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
    };

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

    syncButton();
}

function normalizeLanguage(language) {
    if (!language) return "plaintext";
    const normalized = language.toLowerCase();
    if (normalized === "c++") return "cpp";
    if (normalized === "py") return "python";
    if (normalized === "js") return "javascript";
    if (normalized === "ts") return "typescript";
    if (normalized === "sh") return "bash";
    return normalized;
}

function markdownToHtml(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inList = false;
    let listType = "";
    let inCode = false;
    let codeLanguage = "plaintext";

    const closeList = () => {
        if (inList) {
            html.push(`</${listType}>`);
            inList = false;
            listType = "";
        }
    };

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
                codeLanguage = "plaintext";
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
            html.push(`<h3>${parseInlineMarkdown(line.slice(4))}</h3>`);
            continue;
        }

        if (line.startsWith("## ")) {
            closeList();
            html.push(`<h2>${parseInlineMarkdown(line.slice(3))}</h2>`);
            continue;
        }

        if (line.startsWith("# ")) {
            closeList();
            html.push(`<h1>${parseInlineMarkdown(line.slice(2))}</h1>`);
            continue;
        }

        if (/^- /.test(line)) {
            if (!inList || listType !== "ul") {
                closeList();
                inList = true;
                listType = "ul";
                html.push("<ul>");
            }
            html.push(`<li>${parseInlineMarkdown(line.slice(2))}</li>`);
            continue;
        }

        if (/^\d+\.\s/.test(line)) {
            if (!inList || listType !== "ol") {
                closeList();
                inList = true;
                listType = "ol";
                html.push("<ol>");
            }
            html.push(`<li>${parseInlineMarkdown(line.replace(/^\d+\.\s/, ""))}</li>`);
            continue;
        }

        closeList();
        html.push(`<p>${parseInlineMarkdown(line)}</p>`);
    }

    closeList();
    return html.join("");
}

async function loadSiteData() {
    const [postsResponse, categoriesResponse] = await Promise.all([
        fetch(`${ARTICLE_REPO_BASE}/posts.json?v=${CACHE_BUSTER}`),
        fetch(`${ARTICLE_REPO_BASE}/categories.json?v=${CACHE_BUSTER}`)
    ]);

    if (!postsResponse.ok) throw new Error("无法读取文章索引");
    if (!categoriesResponse.ok) throw new Error("无法读取分类索引");

    return {
        posts: await postsResponse.json(),
        categories: await categoriesResponse.json()
    };
}

function renderTags(tags) {
    if (!tags?.length) return "";
    return `<div class="tag-list">${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>`;
}

function buildCategorySummary(posts, categories) {
    const summary = {};
    for (const category of categories) {
        summary[category.slug] = { ...category, count: 0 };
    }
    for (const post of posts) {
        if (summary[post.category.slug]) {
            summary[post.category.slug].count += 1;
        }
    }
    return Object.values(summary);
}

function sortPosts(posts) {
    return posts.slice().sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare || a.slug.localeCompare(b.slug);
    });
}

function renderPostList(posts) {
    return posts.map((post) => `
        <a class="post-card" href="article.html?slug=${post.slug}">
            <div class="card-meta">${post.date} · ${post.category.name}</div>
            <h3>${post.title}</h3>
            <p>${post.excerpt || ""}</p>
            ${renderTags(post.tags)}
        </a>
    `).join("");
}

function setupSearch(inputId, onFilter) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const applyFilter = () => onFilter(input.value.trim().toLowerCase());
    input.addEventListener("input", applyFilter);
    applyFilter();
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

function renderHome(posts, categories) {
    const categoryGrid = document.getElementById("category-grid");
    const latestPosts = document.getElementById("latest-posts");
    const allCategories = buildCategorySummary(posts, categories);
    const allPosts = sortPosts(posts).slice(0, 12);

    const renderFiltered = (query) => {
        const filteredCategories = allCategories.filter((category) => matchesCategory(category, query));
        const filteredPosts = allPosts.filter((post) => matchesPost(post, query));

        categoryGrid.innerHTML = filteredCategories.length
            ? filteredCategories.map((category) => `
                <a class="category-card" href="category.html?slug=${category.slug}">
                    <div class="category-icon">${category.icon || "·"}</div>
                    <h3>${category.name}</h3>
                    <p>${category.description || ""}</p>
                    <p class="card-meta">${category.count} 篇文章</p>
                </a>
            `).join("")
            : '<div class="empty-state">没有匹配到分类结果。</div>';

        latestPosts.innerHTML = filteredPosts.length
            ? renderPostList(filteredPosts)
            : '<div class="empty-state">没有匹配到文章结果。</div>';
    };

    setupSearch("home-search", renderFiltered);
}

function renderCategory(posts, categories) {
    const slug = getQueryParam("slug");
    const categoryPosts = sortPosts(posts.filter((post) => post.category.slug === slug));
    const title = document.getElementById("category-title");
    const breadcrumb = document.getElementById("category-breadcrumb");
    const list = document.getElementById("category-posts");
    const category = categories.find((item) => item.slug === slug);

    if (!category) {
        title.textContent = "未找到这个分类";
        list.innerHTML = '<div class="empty-state">这个分类暂时没有文章。</div>';
        updateSeoMeta({
            title: "未找到分类 | 侧耳倾听",
            description: "未找到对应的分类页面。",
            url: window.location.href
        });
        return;
    }

    title.textContent = category.name;
    breadcrumb.textContent = category.name;
    updateSeoMeta({
        title: `${category.name} | 侧耳倾听`,
        description: category.description || `查看 ${category.name} 分类下的文章列表。`,
        url: window.location.href
    });

    const renderFiltered = (query) => {
        const filtered = categoryPosts.filter((post) => matchesPost(post, query));
        list.innerHTML = filtered.length
            ? renderPostList(filtered)
            : '<div class="empty-state">这个分类下没有匹配到文章。</div>';
    };

    setupSearch("category-search", renderFiltered);
}

function renderArticlePagination(posts, currentIndex) {
    const pagination = document.getElementById("article-pagination");
    if (!pagination) return;

    const newer = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const older = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

    pagination.innerHTML = `
        ${newer ? `<a class="article-nav-card" href="article.html?slug=${newer.slug}"><span class="article-nav-label">上一篇</span><strong>${newer.title}</strong></a>` : '<span class="article-nav-card is-empty"></span>'}
        ${older ? `<a class="article-nav-card article-nav-card-right" href="article.html?slug=${older.slug}"><span class="article-nav-label">下一篇</span><strong>${older.title}</strong></a>` : '<span class="article-nav-card is-empty"></span>'}
    `;
}

async function renderArticle(posts) {
    const orderedPosts = sortPosts(posts);
    const slug = getQueryParam("slug");
    const currentIndex = orderedPosts.findIndex((item) => item.slug === slug);
    const post = currentIndex >= 0 ? orderedPosts[currentIndex] : null;
    const body = document.getElementById("article-body");

    if (!post) {
        document.getElementById("article-title").textContent = "未找到这篇文章";
        body.innerHTML = "<p>可以返回首页重新选择文章。</p>";
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
    categoryLink.textContent = post.category.name;
    categoryLink.href = `category.html?slug=${post.category.slug}`;

    document.getElementById("article-info").innerHTML = `
        <li>分类：${post.category.name}</li>
        <li>日期：${post.date}</li>
        <li>标签：${post.tags?.length ? post.tags.join(" / ") : "未设置"}</li>
        <li>来源：${post.markdown}</li>
    `;

    const related = orderedPosts
        .filter((item) => item.category.slug === post.category.slug && item.slug !== post.slug)
        .slice(0, 4);

    document.getElementById("related-posts").innerHTML = related.length
        ? related.map((item) => `<li><a href="article.html?slug=${item.slug}">${item.title}</a></li>`).join("")
        : "<li>这个分类下暂时没有更多文章。</li>";

    const response = await fetch(`${ARTICLE_REPO_BASE}/${post.markdown}?v=${CACHE_BUSTER}`);
    if (!response.ok) {
        body.innerHTML = "<p>Markdown 正文读取失败。</p>";
        return;
    }

    const markdown = await response.text();
    body.innerHTML = markdownToHtml(markdown);

    if (window.Prism?.highlightAllUnder) {
        window.Prism.highlightAllUnder(body);
    }

    renderArticlePagination(orderedPosts, currentIndex);
    updateSeoMeta({
        title: `${post.title} | 侧耳倾听`,
        description: post.excerpt || `阅读 ${post.title}`,
        url: window.location.href,
        type: "article"
    });
}

async function init() {
    setupThemeToggle();

    try {
        const page = document.body.dataset.page;
        if (!page) return;

        const { posts, categories } = await loadSiteData();

        if (page === "home") renderHome(posts, categories);
        if (page === "category") renderCategory(posts, categories);
        if (page === "article") await renderArticle(posts);
    } catch (error) {
        const fallback = document.createElement("div");
        fallback.className = "container";
        fallback.innerHTML = `<div class="empty-state">${error.message}</div>`;
        document.body.appendChild(fallback);
    }
}

init();
