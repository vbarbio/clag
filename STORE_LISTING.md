# Chrome Web Store listing (copy and paste)

Texts for the Chrome Web Store Developer Dashboard. Each section matches a field in the dashboard.

## Store listing tab

**Name** (from manifest, not editable here)
CLAG - Clear Labels & Archive for Gmail

**Summary** (from manifest)
One click removes every label from the open thread and archives it. Works in Gmail, Jace and Superhuman. No data collected.

**Category:** Productivity > Workflow & Planning
**Language:** English

**Description**

Inbox zero, one click at a time.

CLAG adds a small "CLA Now" button to the email thread you have open. Click it (or press Alt+Shift+L, Option+Shift+L on Mac) and CLAG:

• removes every label from the thread
• removes its star
• archives it

No more clicking each label's little "x" one by one, then the star, then Archive.

WORKS IN
• Gmail
• Jace
• Superhuman (clears labels; Superhuman handles the rest)

PRIVATE BY DESIGN
• No sign-in, no OAuth, no access to your Google account.
• No data collected, stored or sent anywhere. Everything happens inside the page you already have open.
• No analytics, no tracking.

CUSTOMISABLE SHORTCUT
Click the CLAG icon in the toolbar to see your current shortcut and change it.

SAFE ARCHIVING
CLAG uses Gmail's own "e" shortcut once. If that does not close the thread (for example, if keyboard shortcuts are turned off in Gmail), it clicks Gmail's own Archive button instead. It never acts on a thread other than the one you have open.

OPEN SOURCE
Free and open source under the MIT license. Report bugs or suggest improvements:
https://github.com/vbarbio/clag

This is a beta. Gmail changes its interface from time to time; if something stops working, please open an issue on GitHub.

CLAG is an independent project and is not affiliated with or endorsed by Google, Jace or Superhuman.

**Homepage URL:** https://github.com/vbarbio/clag
**Support URL:** https://github.com/vbarbio/clag/issues

**Graphic assets**
- Store icon: `icons/icon128.png`
- Screenshots: 1280x800 (1 to 5)
- Small promo tile: 440x280

## Privacy tab

**Single purpose description**
CLAG has one purpose: with a single click or keyboard shortcut, remove all labels and the star from the email thread the user has open, and archive it, in Gmail, Jace or Superhuman.

**Host permission justification** (content scripts on mail.google.com, app.jace.ai, mail.superhuman.com)
CLAG runs a content script only on these three email apps. It needs them to place the "CLA Now" button in the open thread and to click that app's own label, star and archive controls on the user's behalf. It does not read email content for any other purpose and sends nothing anywhere.

**Are you using remote code?**
No, I am not using remote code. All JavaScript is included in the package.

**Data usage**
Tick none of the data types. CLAG does not collect or use any user data.

Certify all three statements:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**
https://github.com/vbarbio/clag/blob/main/PRIVACY.md

## Distribution tab

- Visibility: Public (or Unlisted for a quiet beta: only people with the link can install it)
- Regions: All regions
- Price: Free
