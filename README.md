# Antigravity Artifact Translator

This is an extension developed for Antigravity IDE (VS Code), designed to help users quickly translate Artifacts (files or preview content) into their preferred language (default is Chinese).

## Features

- **One-Click Translation**: Quickly invoke the translation function via the Command Palette.
- **Multi-View Support**: Supports translation not only for standard text editors but also for Artifact views like Markdown previews.
- **Instant Preview**: Translation results are displayed directly in a Markdown preview window for a better reading experience without needing to save files.
- **Free API**: Uses free translation APIs (Google Translate & Microsoft Edge Translator), no API Key configuration required.
- **Configurable Language**: Support for 10 common languages including English, Chinese (Simplified/Traditional), Spanish, French, etc.

## Usage

1.  Open any file or Artifact preview (e.g., Markdown preview).
2.  Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
3.  Type and select the command: `Translate Artifact`.
4.  Wait a moment, and the translation result will open in a Markdown preview on the side.

## Configuration

You can change the settings in VS Code Settings:
- Go to Settings (`Cmd+,` or `Ctrl+,`).
- Search for `Antigravity Artifact Translator`.
- **Target Language**: Select your preferred language from the dropdown.
- **Translation Service**: Switch between `Google Translate` (default) and `Microsoft Translator (Edge)`.

## Installation

1.  Download the `.vsix` package.
2.  Open the Command Palette in the IDE.
3.  Select `Extensions: Install from VSIX...`.
4.  Choose the downloaded `.vsix` file to install.
5.  Restart the IDE or reload the window.

## Notes

- This extension uses unofficial translation APIs (Google & Microsoft) for educational and personal use only; rate limits may apply.
- Large files are automatically split into chunks for translation, but very large files may still take some time to process.
