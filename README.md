# Antigravity Artifact Translator

这是一个为 Antigravity IDE (VS Code) 开发的插件，旨在帮助用户快速将 Artifact (文件或预览内容) 翻译成中文。

## 功能特性

- **一键翻译**: 通过命令面板快速调用翻译功能。
- **支持多种视图**: 不仅支持普通的文本编辑器，还支持 Markdown 预览等 Artifact 视图的翻译。
- **即时预览**: 翻译结果直接在 Markdown 预览窗口中展示，无需保存文件，阅读体验更佳。
- **免费 API**: 使用 Google Translate 免费 API，无需配置 Key。

## 使用方法

1.  打开任意文件或 Artifact 预览（如 Markdown 预览）。
2.  打开命令面板 (`Cmd+Shift+P` 或 `Ctrl+Shift+P`)。
3.  输入并选择命令: `Translate Artifact to Chinese`。
4.  稍等片刻，翻译结果将会在右侧以 Markdown 预览的形式打开。

## 安装

1.  下载 `.vsix` 安装包。
2.  在 IDE 中打开命令面板。
3.  选择 `Extensions: Install from VSIX...`。
4.  选择下载的 `.vsix` 文件进行安装。
5.  重启 IDE 或重载窗口。

## 注意事项

- 本插件使用非官方 Google Translate API，仅供学习和个人使用，可能会有速率限制。
- 大文件会自动分块翻译，但过大的文件可能仍会处理较慢。
