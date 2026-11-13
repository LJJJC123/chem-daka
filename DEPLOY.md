# 部署说明

**当前状态：已部署到 GitHub Pages**

- 线上地址：<https://ljjjc123.github.io/chem-daka/>
- 仓库：<https://github.com/LJJJC123/chem-daka>
- 仓库 Settings → Pages → Build and deployment → Source = **GitHub Actions**
- 每次 `git push` 到 `main`，`Deploy to GitHub Pages` 会自动构建并发布（约 1 分钟）

> 用的是 hash 路由（`#today`、`#lab=...`），不需要 SPA 回退规则；`base` 已设为 `'./'`，放在 `/chem-daka/` 这种子路径下也能正常加载。

---

## 改完内容怎么重新发布

```powershell
pnpm check:content
pnpm test
git add -A
git commit -m "更新内容"
git push
```

推上去之后等 Actions 跑完，刷新线上地址即可（Pages 有几十秒缓存）。

---

## 本地预览构建产物

```powershell
pnpm build
pnpm serve:dist      # http://127.0.0.1:5199/chem/
```

`serve:dist` 故意把站点挂在 `/chem/` 子路径下，用来验证相对路径没问题——和线上环境一致。

---

## 备用方案（GitHub 打不开时）

| 方案 | 要账号 | 要备案 | 说明 |
|---|---|---|---|
| 腾讯云 CloudBase 静态托管 | 要 | 不用（默认域名） | 国内访问最快 |
| Gitee Pages | 要（实名） | 不用 | 已有 Gitee 账号时最省事 |
| 自有服务器 + nginx | 要 | 看域名 | 最自由 |
| 单文件版 | 不要 | 不要 | 发到手机直接打开 |

### 单文件版

```powershell
pnpm build:single
```

生成 `dist-single/index.html`（约 960 KB，JS/CSS/3D 全部内联）。可以微信发给自己、存手机本地用浏览器打开、或者丢到任意托管平台。已实测 `file://` 打开正常，3D 也能跑。

### 自有服务器（nginx）

把 `dist/` 上传后：

```nginx
server {
    listen 80;
    server_name your.domain.com;
    root /var/www/chem-daka;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 网络提示

这台电脑的环境变量里有一个已关闭的本地代理（`HTTP_PROXY=http://127.0.0.1:17897`），所有走代理的命令（git / curl / gh / npm）都会失败，报 `Failed to connect to 127.0.0.1:17897`。

临时绕开：

```powershell
$env:HTTP_PROXY=''; $env:HTTPS_PROXY=''; $env:http_proxy=''; $env:https_proxy=''
```

绕开后 GitHub、Gitee、腾讯云都可直连。

---

## 部署后检查清单

- [x] 首页能打开，五个页签能切
- [x] 刷新不 404
- [x] 方程式、选择题能作答并判分
- [x] 3D 实验室能加载
- [x] 手机宽度不横向溢出
- [ ] 换设备前在「设置 → 导出备份」
