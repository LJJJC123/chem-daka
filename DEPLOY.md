# 部署到线上

这个应用是纯静态页面（无后端、无数据库），部署 = 把 `dist/` 里的文件放到一个能访问的目录。

- 已配置 `base: './'`：放在根目录、子目录（如 `https://xxx.com/chem-daka/`）都能正常加载
- 用的是 hash 路由（`#today`、`#lab=...`），**不需要**配置 SPA 回退/重写规则
- 数据存在使用者自己的浏览器里，跟部署在哪无关

---

## 先看这台电脑的网络情况

实测：

| 站点 | 可达 |
|---|---|
| 百度、Gitee、腾讯云、阿里云 | ✅ |
| GitHub、Netlify、Vercel、Cloudflare | ❌（TLS 握手被重置） |

所以**从这台电脑直接推 GitHub Pages / Netlify 是推不上去的**。要么用国内平台，要么换一台能上外网的电脑用浏览器上传。

---

## 方案对比

| 方案 | 要账号 | 要域名备案 | 国内访问 | 难度 | 适合 |
|---|---|---|---|---|---|
| 腾讯云 CloudBase 静态托管 | 要（微信/QQ 登录 + 实名） | 不用（用默认域名） | 快 | 中 | 想要一个稳定链接 |
| Gitee Pages | 要（实名） | 不用 | 快 | 低 | 已有 Gitee 账号 |
| 自己的服务器 / 学校服务器 | 要 | 看域名 | 快 | 中 | 有现成服务器 |
| GitHub Pages | 要 | 不用 | 一般 | 中 | 能上 GitHub |
| Netlify Drop | 不要账号也能传 | 不用 | 慢/不稳 | 低 | 临时演示 |
| 单文件版直接发手机 | 不要 | 不要 | — | 最低 | 自己用、离线也能用 |

---

## 方案 A：腾讯云 CloudBase 静态托管（国内推荐）

1. 打开 <https://console.cloud.tencent.com/tcb>，微信扫码登录，按提示完成实名认证
2. 新建一个「云开发环境」（按量计费，日常用量在免费额度内）
3. 记下环境 ID（形如 `chem-daka-3g8xxxx`）
4. 在本目录执行：

```powershell
npm i -g @cloudbase/cli
tcb login                 # 弹出浏览器，点授权
tcb hosting deploy dist -e 你的环境ID
```

5. 控制台「静态网站托管」里能看到默认域名，形如 `https://你的环境ID.tcloudbaseapp.com`，直接访问即可

> 默认域名不需要备案。想绑自己的域名再走备案流程。

---

## 方案 B：Gitee Pages

1. 在 <https://gitee.com> 新建仓库，比如 `chem-daka`（公开）
2. 把本目录的 `dist/` 内容作为仓库内容推上去：

```powershell
cd dist
git init
git add .
git commit -m "deploy chem-daka"
git remote add origin https://gitee.com/你的用户名/chem-daka.git
git push -u origin master
```

3. 仓库页 → 服务 → Gitee Pages → 部署（首次需要实名认证）
4. 得到 `https://你的用户名.gitee.io/chem-daka`

> Gitee Pages 的免费额度和是否可用以它当前政策为准；部署后重新部署需要手动点一次。

---

## 方案 C：自己的服务器（nginx）

把 `dist/` 上传到服务器，比如 `/var/www/chem-daka`，nginx：

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

`try_files` 是为了 `#lab=...` 之外的路径也不 404；hash 路由本身不需要它，但加上更稳。

---

## 方案 D：GitHub Pages / Netlify（需要能上外网）

在能访问外网的电脑上：

**GitHub Pages**：新建仓库 → 上传 `dist/` 里的文件（或推送）→ Settings → Pages → Source 选 `main` 分支根目录 → 得到 `https://用户名.github.io/仓库名/`

**Netlify**：打开 <https://app.netlify.com/drop>，把 `chem-daka-web.zip` 或 `dist` 文件夹拖进去即可，几秒出链接（可改子域名）。

`dist/` 已经是相对路径构建，两种方式都不用改配置。

---

## 方案 E：单文件版（不部署，直接发手机）

```powershell
pnpm build:single
```

生成 `dist-single/index.html`（约 960 KB，JS/CSS/3D 全部内联），可以：

- 微信/QQ 发给自己，手机浏览器打开
- 存到手机「文件」里，用浏览器打开（Chrome / Safari 都行）
- 加到主屏幕，当 App 用
- 也可以把它丢到上面任意一个托管平台，只传一个文件

已实测：`file://` 打开正常，3D 实验室也能跑（WebGL 不支持时会自动降级）。

---

## 部署后检查清单

- [ ] 首页能打开，五个页签都能切
- [ ] 刷新页面不 404（hash 路由，正常不会）
- [ ] 点「开始打卡」能做方程式、选择题
- [ ] 「练 → 实验 → 酸碱中和滴定」3D 能加载（弱网首次约 1 MB）
- [ ] 手机上打开不横向溢出
- [ ] 换设备前「设置 → 导出备份」

---

## 打包

```powershell
pnpm build
Compress-Archive -Path dist\* -DestinationPath chem-daka-web.zip -Force
```

`chem-daka-web.zip` 可以直接拖到 Netlify Drop，或上传到任意静态托管。
