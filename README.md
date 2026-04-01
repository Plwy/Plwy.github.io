# Plwy.github.io

这是博客站点仓库，只负责页面结构、样式和前端逻辑。

## 文章仓库

文章内容单独存放在：

- `Plwy/plwy-articles`

当前站点在运行时直接从该仓库读取：
- `categories.json`
- `posts.json`
- `articles/<category>/*.md`

## 写文章时怎么做

1. 只修改 `plwy-articles` 仓库
2. 新增 Markdown 到 `articles/<分类>/`
3. 在 `posts.json` 里新增文章记录
4. 推送文章仓库后，网站刷新即可读取最新内容

## 注意事项

1. `slug` 必须唯一
2. `markdown` 路径必须和文章实际路径一致
3. `category.slug` 必须来自 `categories.json`
4. Markdown 文件统一使用 UTF-8
