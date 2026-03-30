# Plwy Articles Template

建议新建独立文章仓库名：

- `Plwy/plwy-articles`

仓库结构保持为：

```text
categories.json
posts.json
articles/
  paper/
  algorithm/
  deploy/
  llm/
  robot/
  cpp/
  python/
  dev-env/
  software-engineering/
  tools/
  misc/
  invest/
  daily/
```

## 添加文章的注意事项

1. `posts.json` 中的 `slug` 必须唯一，且要和文章文件名一一对应。
2. `markdown` 路径从文章仓库根目录开始写，例如 `articles/paper/transformer-notes.md`。
3. `category.slug` 必须来自 `categories.json` 里已经定义好的分类。
4. Markdown 文件使用 UTF-8 编码。
5. 尽量只改文章仓库，不在站点仓库里手工编辑 `content/articles`。

## 同步到网站仓库

在网站仓库 `Plwy.github.io` 里设置 GitHub Actions 仓库变量：

- `ARTICLES_REPO=Plwy/plwy-articles`
- `ARTICLES_BRANCH=main`

之后可以：

- 手动运行 `Sync Articles` workflow
- 或等待每小时的定时同步
