# Version 2 Release Checklist

## Code and tests

- [x] Run `npm ci`
- [x] Run `npm run vendor`
- [x] Run `npm test`
- [x] Run `npm run test:performance`
- [x] Run `npm run test:browser`
- [x] Run `npm run test:syntax`
- [x] Confirm that `index.html` contains no external CDN URLs
- [x] Confirm that `vendor/licenses/` contains all redistributed license texts

## Real backup verification

Test with copies of personal backups that contain no irreplaceable data:

- [x] Ordinary SMS-only backup — 8 MB real backup, 16,153 records, 413 contacts
- [x] Local and international number variants
- [ ] Unknown and alphanumeric senders
- [x] Backup with more than 200 messages in one conversation
- [ ] MMS text message
- [ ] MMS with at least one image or other attachment
- [ ] Backup larger than 100 MB
- [x] Largest available real backup — 8 MB at the time of testing
- [ ] Cancel an import and confirm partial data is removed
- [ ] Reload the page and confirm the completed index is restored

## Browser verification

- [x] Chromium or Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Direct `index.html` opening for an ordinary backup
- [ ] `python3 -m http.server 8000` for a large backup
- [ ] GitHub Pages deployment, when used

## Release preparation

- [ ] Replace repository screenshots with Version 2 screenshots
- [x] Confirm the README repository URL
- [ ] Confirm a GitHub Pages URL if Pages is enabled
- [x] Commit `package-lock.json`
- [x] Do not commit `node_modules/`
- [ ] Tag the release as `v2.0.0` after the V2 commit reaches `main`
- [ ] Use the `2.0.0` changelog section as the GitHub release notes
