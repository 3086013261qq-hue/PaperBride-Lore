# PaperBride MVU

《纸嫁衣》咩咩全栈 MVU。

> 核心原则：**业务只保留两块：手动篇章选择 + 网易云音乐。**
>
> 表现层最高优先级：`docs/007_给静静的纸嫁衣_MVU成熟滑卷继承与视觉高保真硬锁_v1.0.md` + `mvu/visual-fidelity.v1.json`。

## 1. 九卷篇章

1. MAIN01《纸嫁衣》
2. MAIN02《纸嫁衣2：奘铃村》
3. MAIN03《纸嫁衣3：鸳鸯债》
4. MAIN04《纸嫁衣4：红丝缠》
5. MAIN05《纸嫁衣5：来生戏》
6. MAIN06《纸嫁衣6：千秋魇》
7. MAIN07《纸嫁衣7：卿不负》
8. MAIN08《纸嫁衣8：千子树》
9. MAIN09《纸嫁衣9：罗浮梦》

每卷正常状态只使用 `media/mvu/illustrations/` 的官方宣传插画/壁纸；旧 App/商店式封面不得作为正常主视觉。

### 成熟左右滑卷｜禁止再造轮子

正式继承《狐妖小红娘·梦灯笼》与《明日方舟》成熟流程：

- 浏览器原生横向滚动；
- CSS `scroll-snap-type:x mandatory`；
- 每卷 `scroll-snap-align:center`；
- 当前预览居中，左右邻卷露边；
- 手机原生 Swipe；
- 桌面/平板可滚动，并保留左右箭头；
- 键盘左右/Home/End可用；
- **禁止 `pointerdown + translate3d` 自制轮播。**

Swipe / 箭头 / 点位 / 点卷面只更新临时 `previewId`，不得写世界书。

只有明确点击 `进入此卷 / 落印启卷` 才执行：

`关闭其他 MAIN → 开启目标 MAIN → ACTIVE 同步 → 必要时 MAIN_DATE_REBASE → DATE_LOCK`

未确认前不得改 `enabled / ACTIVE / currentDate / DATE_LOCK / MAIN_DATE_REBASE`。

## 2. 视觉高保真 HARD LOCK

权威机器可读规范：`mvu/visual-fidelity.v1.json`。

固定气质：

`旧婚书 / 黑漆暗木 / 朱砂印 / 红线姻缘 / 丧白纸页 / 旧金细线 / 纸灰 / 灯影 / 墨晕 / 中式民俗悬疑`

当前实机旧样式以下全部永久判定 FAIL：

- 黑色后台网格；
- 顶部两个巨大普通矩形 Tab；
- 大米黄当前卷说明板；
- 九卷双列/三列卡墙；
- 图片下面大米黄标题底座；
- 商品卡/素材管理页/后台 Dashboard 感；
- 巨大“当前篇章”竖牌。

正式九卷页必须：

- 一次只突出一个官方主视觉；
- 卷卡占宽约 82～88%，左右邻卷露边；
- 手机主视觉约 4:5，宽屏可 16:10；
- 卷名叠在主图底部暗遮罩；
- MAIN 编号为小角标；
- 当前卷为小朱砂印；
- 下方只保留极简信息带与一个 `进入此卷 / 落印启卷`；
- 必须读取 `objectPosition`，避免裁掉脸与标志性发饰。

隐藏所有标题文字后，仅看构图/色彩/红线/朱砂/旧纸/官方人物图，也必须仍然像《纸嫁衣》而不是普通网页；否则视觉 QA FAIL。

## 3. 特效

移动端总节点 <=10：

- 红线 2；
- 纸灰约 4；
- 灯影 2；
- 墨雾 1。

必须真实 DOM、`pointer-events:none`、低频动画、支持 `prefers-reduced-motion`。特效失败不得影响点击。

## 4. 网易云

只保留一套成熟单实例模块：

- `auto=0`；
- 10 首正式歌单；
- 任意时刻最多一个活动 iframe；
- 切 `九卷篇章 / 灯下余音` 不销毁、不清 src、不重建播放器；
- 合上婚书也不因视图切换主动停歌；
- `CHAT_CHANGED` / 整体 dispose 才释放。

灯下余音表现层也必须服从同一黑漆/朱砂/旧金/旧纸语言，不得像孤立第三方后台块。

## 5. 远程媒体

`GitHub → jsDelivr → SillyTavern / MVU`

CDN：

`https://cdn.jsdelivr.net/gh/3086013261qq-hue/PaperBride-Lore@main/media/mvu/`

卡体不得 Base64 内嵌九张插画。

## 6. 世界书与 MVU 职责分离

- 人物标志性装饰：`characters/`；
- P0 身高/体重/罩杯：人物正文 + 视觉推定审计；
- 系列梗：`worldbook/系列梗与彩蛋_v1.md`；
- MVU：只负责选篇、预览、音乐与明确玩家操作。

表现层不得成为第二事实源。

## 7. Android / SillyTavern 硬验收

必须覆盖 360 / 390 / 412 / 430px：

- 无整体横向爆版；
- Swipe自然；
- 左右邻卷露边；
- 无双列卡墙；
- 无大米黄说明板；
- 主视觉人物脸/标志装饰不被错误裁切；
- Swipe 多卷不改世界书；
- 落印后才切卷；
- 音乐跨视图不断。

QA：`qa/mvu/MVU_视觉高保真硬门槛_v1.md`。

## 8. 权威文件

- `docs/007_给静静的纸嫁衣_MVU成熟滑卷继承与视觉高保真硬锁_v1.0.md`
- `mvu/visual-fidelity.v1.json`
- `mvu/media-manifest.v1.json`
- `media/mvu/illustrations/source-map.v2.json`
- `qa/mvu/MVU_视觉高保真硬门槛_v1.md`
- `timeline/fullstack/README.md`
- `worldbook/系列梗与彩蛋_v1.md`
- `characters/P0_标志性装饰审计_v1.md`
- `characters/P0_体格数据视觉推定_v1.md`
