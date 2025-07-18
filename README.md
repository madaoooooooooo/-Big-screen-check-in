# 签到系统

## 项目简介
本项目为纯前端实现的会议签到座序图，无需配置环境，直接用浏览器打开 `index.html` 即可使用。

- 9:16竖屏设计，适合大屏展示
- 支持10x15座位布局
- 可添加人名，自动分配座位
- 编辑模式下可拖动调整座位
- 点击座位可标记签到状态
- 支持一键导出整个项目为ZIP包

## 使用说明
1. 打开 `index.html`，即可看到座序图页面。
2. 点击右上角“管理座位”可添加人名。
3. 添加后保存，人名会自动分配到座位。
4. 左上角“编辑”按钮可进入拖动模式，拖动座位调整顺序，保存退出。
5. 点击有名字的座位可切换签到状态。
6. 右下角“导出ZIP”可下载整个项目源码包。

## 依赖
- 仅依赖 [JSZip](https://stuk.github.io/jszip/)（导出ZIP时自动加载，无需手动引入）

## 目录结构
- index.html  主页面
- style.css   样式文件
- script.js   逻辑脚本

<img width="590" height="1021" alt="1" src="https://github.com/user-attachments/assets/2c15fe1f-9ad6-439c-b6e2-ade3674c1b25" />

<img width="576" height="1024" alt="2" src="https://github.com/user-attachments/assets/6ef9ce97-4968-4d43-8bd0-7157d7ec30af" />
