# 源站观测记录 · shuxiang-cinematic.pages.dev

## 路由与页面归属

| 路由 | 源文件 | 主要内容 |
| --- | --- | --- |
| `/` | index.html | hero、路线四站、证据四数、运营闭环、序章入口 |
| `/libraries` | libraries.html | 四组统计、5 条政策、石岐地图、21 点位、5 份档案 |
| `/solution` | solution.html | 3 卡方案、4 步护照流程、4 季活动、4 段 AI、4 类书单、6 张 IP 图 |
| `/experience` | experience.html + planner/platform/heritage | 六视图工作台 |
| `/evidence` | evidence.html | 4 项方法、5 组问题、4 项活动分析、三阶段成果、数据边界 |

## 设计令牌（源站声明值）

```
--ink #0f3f35  --ink-2 #1f5a4e  --paper #f6efe1  --paper-2 #e9dfca
--white #fffdf7 --clay #c95736  --gold #b58a3a  --aqua #3c8f8b
--line rgba(15,63,53,.16)  --line-strong rgba(15,63,53,.28)
--radius 8px  --wrap 1180px  --shadow 0 18px 42px rgba(25,53,46,.11)
serif: Noto Serif SC → Source Han Serif SC → Songti SC → serif
sans : Microsoft YaHei → Noto Sans SC → Arial
```

字体全部来自系统栈，源站未加载任何 webfont。

## 关键尺寸（1440×900 实测）

- 导航 `.nav-shell` 74px（≤640px 时 66px）；二级导航 `.subnav` 吸顶 `top:74px`。
- 首页 hero：`min-height: calc(100vh - 74px)`，栅格 `1.02fr .98fr`，间距 56px。
- 路线卡 `.route-board`：4 列，卡内 `min-height:300px`，序号圆 42px，`margin-bottom:60px`。
- 章节 `.section-head`：`180px 1fr` + 34px 间距，`margin-bottom:42px`。
- 首页文档高 3809px，`/libraries` 5662px，`/solution` 5539px，`/evidence` 4170px。

## 交互规则

- 导航：滚动 >12px 加 `body.scrolled`；移动端 `body.menu-open` 锁滚动，Esc 关闭；当前页 `aria-current=page` + 陶红下划线缩放。
- 书房点位：类型筛选 + ≤640px 只显示前 6 个，按钮文案在「查看更多点位（N）」/「收起点位」间切换，窗口尺寸变化重渲染。
- 书单：4 个 `.book-panel` 互斥显示。
- 档案 `.profile`：原生 `<details>`，展开符号 ＋/－；末尾由 JS 注入「以这间书房策划活动」。
- 序章：4 个站点（0 待机 / 1 空间 / 2 数据 / 3 尾声），滚轮 420ms 锁，动画 6s/5.2s/6s，`ease()` 为 cubic 0.55 + quad 0.30 + linear 0.15 混合；数据行按 0.18/0.38/0.62 进度点亮，问句 0.84。
- 工作台：`localStorage` 保存活动档案；策划稿状态随输入变「需求已变更」并禁用人工核对；读者模式隐藏侧栏，用「切换视图」返回。

## 素材

- `seq_space/` 与 `seq_problem/` 各 145 张 webp，单帧 80–135KB，合计约 33MB。
- 图片：石岐地图 405KB、20 枚徽章合集、6 张 IP 图、3 张书房档案照片。
