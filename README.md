# Plwy.github.io

这是博客站点仓库，主要负责页面、样式和前端逻辑。

## 文章独立仓库方案

文章内容建议放到单独仓库，例如：

- `Plwy/plwy-articles`

站点仓库通过 GitHub Action 定时或手动同步文章仓库内容到本地 `content/`。

## 当前同步方式

- 同步脚本: `scripts/sync_articles.py`
- 同步工作流: `.github/workflows/sync-articles.yml`
- 文章仓库模板: `article-repo-template/`

## 需要设置的 GitHub Actions Variables

- `ARTICLES_REPO`
  例如 `Plwy/plwy-articles`
- `ARTICLES_BRANCH`
  例如 `main`

## 添加文章时的注意事项

1. 在独立文章仓库里编辑，不要直接改站点仓库 `content/articles`
2. `posts.json` 的 `slug` 必须唯一
3. `markdown` 路径写文章仓库内相对路径，例如 `articles/paper/xxx.md`
4. `category.slug` 必须来自 `categories.json`
5. Markdown 文件统一使用 UTF-8
