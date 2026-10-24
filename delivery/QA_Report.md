# 纸嫁衣组装QA

结论：**本地装配检查PASS；正式交付验收BLOCKED。**

| 项目 | 结果 | 证据 |
|---|---|---|
| 44人物/18能力/43地点/38设定/9时间线 | PASS | assembly/counts.json |
| 152正文块与源文件完全一致 | PASS | assembly/source-inventory.json与package-validation.json |
| 封版96文件与指定基线相同 | PASS | package-validation.json |
| 939事实节点+9沙盒尾状态 | PASS | package-validation.json |
| 172条目顺序、前缀、keys、单MAIN启用 | PASS | 全栈封装工具无格式警告 |
| MAIN01～09原子切换/ACTIVE | PASS，模拟接口 | controller-test-report.json |
| 过渡措辞/稳定沙盒/日期不自动切卷 | PASS，模拟接口 | controller-test-report.json |
| 日期顺延/跨午夜时刻/事实保持 | PASS，模拟接口 | controller-test-report.json |
| 写入失败/回读不符/回滚/并发点击 | PASS，模拟接口 | controller-test-report.json |
| 九卷手机点击确认/取消/预览不写状态 | PASS，Chromium | browser-test-report.json |
| 248/278/360/390/560/690/860px无横溢 | PASS，Chromium | browser-test-report.json |
| 44px触控目标/不挂用户楼/当前卷印记 | PASS，Chromium | browser-test-report.json |
| CDN失败仍可切卷/减少动画 | PASS，模拟断网 | browser-test-report.json |
| auto=0/单iframe/切歌与卸载清理 | PASS，模拟网易云 | browser-test-report.json |
| PNG CRC/chara/ccv3与JSON相等 | PASS | package-validation.json |
| 立冬封面RGB像素一致 | PASS | package-validation.json |
| 网易云11首正式版本ID | 10/11，BLOCKED | Music_Verification.md |
| 实际网易云出声、VIP/地区可播、App跳转 | NOT_EXECUTED | 没有冒充音频实测 |
| Android/SillyTavern实际导入/可见性/点击 | NOT_EXECUTED | 无用户设备会话 |
| 模型输出status→实际世界书召回与写入 | NOT_EXECUTED | 需真实酒馆完整一轮 |

Node控制器104项通过；Chromium浏览器57项通过。截图使用本地中文字体以保证测试环境可读，图片请求由仓库原字节响应；没有把CDN模拟加载标成真实公网可达测试。

## 现有资料差异（仅记录，不修改）

- MAIN02实际封版尾状态从2021-08-26开始，README/前置QA写2021-08-24；本次保留MAIN02正文原样。
- MAIN06实际封版尾状态默认终点为2023-09-02，README/前置QA写2023-02-03；本次保留MAIN06正文原样。
- 默认沙盒窗口终点不触发任何切卷，不阻断长期自由行动，因此上述差异没有被用作自动切卷条件。

## 用户设备验收步骤

1. 导入候选PNG，允许酒馆助手角色脚本，确认世界书已绑定；新聊天打开婚书，核对九卷封面与当前卷印记。
2. 选任意篇章，确认前ACTIVE/enabled不变；确认后仅目标MAIN启用。开始故事检查原生status召回。
3. 在进行中尝试换卷应提示完成本卷；过渡措辞仍不允许；真正稳定沙盒后可手动进入其他卷，日期超过默认起点时不倒退。
4. 关闭网络检查封面占位仍能点选；依次选两首已核实歌曲，手动点击网易云播放，确认无双音源；合上婚书后音频停止。
5. 补足《海市蜃楼》准确网易云原唱链接后重新核验、构建，再完成Android真机一轮，才能正式封版。
