# 「数」香满屋 · 香山书房数字文化运营（克隆实现）

源站：<https://shuxiang-cinematic.pages.dev>（静态站点，5 个页面 + Canvas 逐帧电影序章）
本站：Next.js 16 App Router + React 19 + TypeScript（strict），无运行时依赖，纯 CSS 设计系统。

## 运行

```bash
npm install        # 已安装，可跳过
npm run dev        # http://localhost:3000
npm run build      # 生产构建（当前通过）
npm start          # 运行构建产物
```

## 路由映射

| 源站 | 本站 | 页面内容 |
| --- | --- | --- |
| `index.html` | `/` | 首页：hero、城市阅读长卷、证据底座、运营闭环、电影序章入口 |
| `libraries.html` | `/libraries` | 认识香山书房：总体网络、政策时间轴、石岐地图、21 点位筛选、五间书房档案 |
| `solution.html` | `/solution` | 数字运营方案：总体方案、文化护照、活动体系、AI 运营、热门书单、IP 建设 |
| `experience.html` | `/experience` | AI 运营系统（运营工作台 2.0）：策划 / 宣传 / 读者 / 复盘 / 资料库 / 档案 六个视图 |
| —（新页面） | `/experience/passport` | 数字文化护照：护照本封面、六类徽章集章、五步使用方式、21 处盖章点位 |
| `evidence.html` | `/evidence` | 证据与成果：调研方法、问题证据、活动分析、实践成果、数据边界 |
| `index.html#cinematic` | `/#cinematic` | 电影序章深链直接开场 |

导航栏「在线体验」自 v2.1 起为二级菜单，下挂「AI 运营系统」`/experience` 与「数字文化护照」`/experience/passport`。

## 代码结构

```
src/app/                     # 6 个路由 + globals.css（设计系统，约 3.8k 行）
src/components/
  site-header.tsx            # 吸顶导航、二级菜单、移动端菜单、aria-current
  site-footer.tsx            # 页脚（各页文案不同，由页面传入）
  reveal-observer.tsx        # 源站同款 IntersectionObserver
  cine-open-button.tsx       # 触发序章的客户端按钮
  cinematic/cinematic.tsx    # Canvas 逐帧序章（290 帧、滚动/触摸/键盘驱动）
  pages/                     # 书房点位筛选、书单切换
  workspace/                 # 运营工作台六个视图、档案持久化、Canvas 海报与阅读卡
src/lib/content.ts           # 点位、书房档案、书单、策划器资料
public/seq_space|seq_problem # 2×145 张 webp 序列帧（源站原始素材）
public/assets/               # 地图、徽章合集、IP 图、书房照片
docs/research/shuxiang/brief.md # 观测记录（尺寸/字体/交互规则）
docs/compare/                # 源站 vs 本站截图（桌面 1440 / 移动 390，见下）
scripts/                     # 抓取素材、截图对比、几何对比、交互回归脚本
```

## 实现要点

- **设计系统**：CSS 变量（`--ink/--paper/--clay/--gold/--aqua` 等）、断点（1100/1050/900/800/640/430）与源站逐条对齐；刻意不引入 Tailwind preflight，以还原源站依赖的浏览器默认排版（`p`、`ol/ul`、`figure` 的 UA 外边距）。
- **电影序章**：帧预加载（后台并发 3、激活并发 8）、`ease()` 混合缓动、黑场转场、数据行按进度点亮、鼠标滚轮/回车/方向键/左滑右滑、`sessionStorage` 记忆、`/#cinematic` 深链。
- **运营工作台**：视图切换与 hash 同步、活动档案写 `localStorage`、策划稿状态机（草稿 / 需求已变更 / 已编辑 / 已人工确认）、宣传包四渠道文案、海报与阅读卡 Canvas、读者四步旅程与四枚体验章、复盘与下一次策划回流、档案搜索与导出。

## 与源站的差异（已确认）

1. **AI 策划改本地生成**：源站 `POST /api/plan` 由服务端模型生成（需要其密钥），本站不持有该接口。改为本地模板合成，并在 `.planner-service`、状态行、策划稿“生成说明”与宣传文案结尾标注「本地演示生成 · 未经模型调用」；策划稿结构、编辑器、状态机、下载格式与源站一致。
2. **观众模式徽章位置**：源站 `.badge-art` 只用一张合集图且默认 `background-position`，四枚徽章显示为空白裁切；本站按 5×4 网格给出各自偏移，徽章可见（属修正而非复刻）。
3. **海报画布**：本站绘制的海报含地图封面、标题、时间地点、亮点与品牌页脚；构图与源站模板不逐像素一致，因为源站海报由运行时数据生成。
4. **少量缺失属性**：源站 `data-planner-* / data-journey-*` 等 JS 钩子在 React 版本中由状态取代，DOM 中不再输出。
5. **示例 JSON**：`/assets/examples/deepseek-test-20261009.json` 已随站点抓取，可正常下载。

## 验证记录

- `npx tsc --noEmit`、`npx eslint src`、`npx next build` 全部通过（5 个路由预渲染为静态页）。
- 几何对比（`node scripts/measure.mjs`，1440×900）：`/` Δ0、`/evidence` Δ0、`/libraries` Δ-4、`/solution` Δ-3 像素级文档高度差。
- 截图对比（`node scripts/capture.mjs`，`docs/compare/`）：移动端 `/`、`/evidence`、`/solution` 多屏与源站**字节级一致**。
- 序章对比（`node scripts/capture-cinematic.mjs`）：加载态、首帧、第一章结束、第二章数据页、尾声 5 个状态与源站**字节级一致**。
- 交互回归（`node scripts/flow-check.mjs`）：策划稿生成（1296 字）、宣传包（190 字）、海报画布 900×1200 非空、阅读旅程点亮 1/4 徽章、复盘保存、档案计数 1、控制台零报错。
