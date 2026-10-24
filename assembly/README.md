# 纸嫁衣1～9组装工程

唯一封版资料基线：ff8d31a740e362f0c54d7feddfd537807eee0a72。

当前产物是 **装配候选**，不是全部验收通过的正式封版：11首曲目中10首完成元数据/官方版本对照，附加曲《海市蜃楼》仍缺可靠网易云ID；Android/SillyTavern实机尚未执行。

## 使用

1. SillyTavern安装并启用酒馆助手，导入delivery中的PNG，允许卡内脚本。
2. 内嵌世界书随卡导入绑定。不要重复导入同一份独立世界书。
3. 开新聊天，开场楼底部“纸嫁衣·展开婚书”打开界面。封面首次点击只预览，明确点击“进入此卷 / 开始新篇章”才换卷。
4. 初次选卷可任选；剧情开始后须到稳定沙盒期才能进入其他卷。卷完成后长期自由行动，日期和任何沙盒措辞均不自动切卷。
5. 音乐需主动选曲，再点击网易云播放器。未核实的一首保留歌单名称但不载入错误音源。
6. 此候选使用原生worldbook接口，世界书是ACTIVE/MAIN/日期顺延的唯一持久记录；不增加人物、背包、地图等变量，也不修改咩咩预设。没有另建AI写入MVU变量系统。

## 重建与检查

Python3 + Pillow；Node.js；浏览器QA另需Playwright和Chromium（测试文件内浏览器路径按环境修改）。

```sh
python assembly/build.py
node --check assembly/src/bundle.js
node assembly/test-controller.cjs
node assembly/test-browser.cjs
python assembly/tools/pack_card.py delivery/PaperBride_1-9_v1.0.0_assembly-candidate.json -i assembly/cover.png
python assembly/validate-package.py
```

打包工具为咩咩制卡·全栈v1.0.0原始脚本；母版为该包的2.0.0世界书母版。复用了已验证梦灯笼的单实例网易云模块，删去自定义歌曲/歌单输入，只保留固定11首目录。

封版资料目录未改动。运行时日期顺延只对已绑定世界书实例生效。原图JPEG解码后转PNG，864×1536 RGB像素逐字节相同；没有AI重绘、裁切或改字。

详情见delivery中的构建与QA报告。
