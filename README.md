# CLAG - Clear Labels & Archive for Gmail

A tiny browser extension that adds a **CLA Now** button to the open email thread.
One click removes every label from the thread, removes its star and archives it.

> **Beta (v0.1.x).** It works, but Gmail changes its interface often. Please report anything odd in the issues.

Works in **Gmail**, **Jace** and **Superhuman** (on Superhuman it clears labels only).

- No OAuth, no Google account access, no setup.
- No data collected, stored or sent anywhere. Everything runs inside the page you have open.
- Open source under the MIT license.

## Install

- **Chrome Web Store:** coming soon.
- **From source:** download this repo, open `chrome://extensions`, turn on *Developer mode*,
  click *Load unpacked* and pick the repo folder. Works in any Chromium browser (Chrome, Edge, Brave, Comet...).

## How it works in Gmail

1. Open a thread that has labels. The **CLA Now** button appears in the thread toolbar.
2. Click it. CLAG removes each label, unstars the thread and archives it.
3. Archiving uses Gmail's `e` shortcut once. If that does not close the thread
   (for example, keyboard shortcuts are off in Gmail settings), CLAG clicks Gmail's own Archive button instead.
   It never presses `e` twice, so it cannot archive the next thread by mistake.

Tip: turn on keyboard shortcuts in Gmail (Settings > General > Keyboard shortcuts) for the most reliable result.

## Known limits

- It works by reading Gmail's page, not through an API. If Gmail changes its interface, the button may stop
  appearing until the extension is updated. Please open an issue if that happens.
- System labels are recognised in English, Spanish and Portuguese.

## Contributing

Bug reports, ideas and pull requests are welcome. Use the issue templates in this repo.

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version: CLAG collects nothing.

## License

[MIT](LICENSE) © 2026 Valter Barbio. You can use, change and share it freely; just keep the copyright notice.
