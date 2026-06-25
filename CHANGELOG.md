# Changelog

All notable changes to the Book Text Formatter extension will be documented in this file.

## [0.1.0] - 2025-06-26

### Added

- Initial release
- Right margin word wrapping at configurable width (default: 80 characters)
- Double spacing option (blank line between every line)
- Smart cleanup: normalize line endings, collapse extra whitespace
- Paragraph break preservation (blank lines in source = paragraph separators)
- Selection support: format selected text or entire document
- User-configurable settings via VS Code settings UI

### Developer

- ESLint configuration with TypeScript support
- MIT License
- GitHub repository metadata in package.json