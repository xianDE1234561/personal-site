# SONG 个人网站

个人影像与灵感收藏网站，采用紫色主题。包括精选轮播、动漫 / 游戏 / 猪蹄相册、124 张影像、7 首可选音乐、动态 GIF 头像与社交链接。

## GitHub Pages

发布目录为 `docs/`，GitHub Pages 配置使用 `main` 分支的 `/docs` 文件夹。

网站地址：https://xianDE1234561.github.io/personal-site/

页面使用相对资源路径，可以直接部署到 GitHub Pages 的项目路径。

本地预览：

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory docs
```

## 更新页面

- `docs/index.html`：个人资料、联系方式和社交链接。
- `docs/style.css`：紫色主题与响应式布局。
- `docs/app.js`：相册筛选、搜索、大图浏览与音乐控制。
- `docs/content.json`：相册与音乐数据。
- `docs/assets/`：图片、缩略图、GIF 头像和音乐。

修改后提交到 `main` 分支，GitHub Pages 会自动重新发布。

## 原项目

仓库根目录的 `src/`、`public/`、`api/`、`server.js` 等是原有 React / Vite 项目。当前 GitHub Pages 使用 `docs/` 静态版本，不运行管理 API。

## 个人链接

- GitHub：https://github.com/xianDE1234561
- Bilibili 主要更新账号：https://space.bilibili.com/3747562465004211
- Steam：https://steamcommunity.com/profiles/76561199732762490/
