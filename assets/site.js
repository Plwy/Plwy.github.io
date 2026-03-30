const CACHE_BUSTER = "20260401b";

async function loadSiteData() {
    const [postsResponse, categoriesResponse] = await Promise.all([
        fetch(`content/posts.json?v=${CACHE_BUSTER}`),
        fetch(`content/categories.json?v=${CACHE_BUSTER}`)
    ]);
    if (!postsResponse.ok) throw new Error("无法读取文章索引");
    if (!categoriesResponse.ok) throw new Error("无法读取分类索引");
    return {
        posts: await postsResponse.json(),
        categories: await categoriesResponse.json()
    };
}

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

function markdownToHtml(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let inList = false;
    let listType = "";
    let inCode = false;

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
                html.push("<pre><code>");
            } else {
                inCode = false;
                html.push("</code></pre>");
            }
            continue;
        }

        if (inCode) {
            html.push(escapeHtml(rawLine) + "\n");
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

function renderTags(tags) {
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

function renderPostList(posts) {
    return posts.map((post) => `
        <a class="post-card" href="article.html?slug=${post.slug}">
            <div class="card-meta">${post.date} · ${post.category.name}</div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            ${renderTags(post.tags)}
        </a>
    `).join("");
}

function renderHome(posts, categories) {
    const categoryGrid = document.getElementById("category-grid");
    const latestPosts = document.getElementById("latest-posts");
    const categorySummary = buildCategorySummary(posts, categories);

    categoryGrid.innerHTML = categorySummary.map((category) => `
        <a class="category-card" href="category.html?slug=${category.slug}">
            <div class="category-icon">${category.icon || "·"}</div>
            <h3>${category.name}</h3>
            <p>${category.description}</p>
            <p class="card-meta">${category.count} 篇文章</p>
        </a>
    `).join("");

    latestPosts.innerHTML = renderPostList(posts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8));
}

function renderCategory(posts, categories) {
    const slug = getQueryParam("slug");
    const categoryPosts = posts.filter((post) => post.category.slug === slug);
    const title = document.getElementById("category-title");
    const desc = document.getElementById("category-description");
    const breadcrumb = document.getElementById("category-breadcrumb");
    const list = document.getElementById("category-posts");
    const category = categories.find((item) => item.slug === slug);

    if (!category) {
        title.textContent = "未找到这个分类";
        desc.textContent = "可以返回首页重新选择分类。";
        list.innerHTML = '<div class="empty-state">这个分类暂时没有文章。</div>';
        return;
    }

    title.textContent = category.name;
    desc.textContent = category.description;
    breadcrumb.textContent = category.name;
    document.title = `${category.name} | 侧耳倾听`;
    list.innerHTML = categoryPosts.length ? renderPostList(categoryPosts) : '<div class="empty-state">这个分类暂时没有文章。</div>';
}

async function renderArticle(posts) {
    const slug = getQueryParam("slug");
    const post = posts.find((item) => item.slug === slug);
    const body = document.getElementById("article-body");

    if (!post) {
        document.getElementById("article-title").textContent = "未找到这篇文章";
        body.innerHTML = "<p>可以返回首页重新选择文章。</p>";
        return;
    }

    document.title = `${post.title} | 侧耳倾听`;
    document.getElementById("article-title").textContent = post.title;
    document.getElementById("article-title-breadcrumb").textContent = post.title;
    document.getElementById("article-meta").textContent = `${post.date} · ${post.category.name} · ${post.tags.join(" / ")}`;

    const categoryLink = document.getElementById("article-category-link");
    categoryLink.textContent = post.category.name;
    categoryLink.href = `category.html?slug=${post.category.slug}`;

    document.getElementById("article-info").innerHTML = `
        <li>分类：${post.category.name}</li>
        <li>日期：${post.date}</li>
        <li>标签：${post.tags.join(" / ")}</li>
        <li>来源：${post.markdown}</li>
    `;

    const related = posts.filter((item) => item.category.slug === post.category.slug && item.slug !== post.slug).slice(0, 4);
    document.getElementById("related-posts").innerHTML = related.map((item) => `
        <li><a href="article.html?slug=${item.slug}">${item.title}</a></li>
    `).join("") || "<li>这个分类下暂时没有更多文章。</li>";

    const response = await fetch(post.markdown);
    if (!response.ok) {
        body.innerHTML = "<p>Markdown 正文读取失败。</p>";
        return;
    }

    const markdown = await response.text();
    body.innerHTML = markdownToHtml(markdown);
}

async function init() {
    try {
        const { posts, categories } = await loadSiteData();
        const page = document.body.dataset.page;

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
