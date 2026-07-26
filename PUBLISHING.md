# Publishing Version 2.0.0

The previous Version 1 source has already been preserved on the GitHub branch:

```text
archive/v1
```

## Requirements

Install the following commands locally:

- Git
- Node.js 20 or newer
- npm
- GitHub CLI (`gh`)
- `rsync`

Authenticate once:

```bash
gh auth login
gh auth status
```

## Automated publication

Extract the GitHub-ready package and run:

```bash
chmod +x publish-v2.sh
./publish-v2.sh
```

An alternative empty work directory can be passed as the first argument:

```bash
./publish-v2.sh "$HOME/Downloads/smsviewer-release-worktree"
```

The script will:

1. clone `petrk94/smsviewer`,
2. update `main`,
3. replace Version 1 with the Version 2 source,
4. install exact dependencies,
5. rebuild bundled local vendor files,
6. run tests, the performance test, syntax checks, and `npm audit`,
7. commit as `Release Version 2.0.0`,
8. push `main`,
9. create and push the annotated tag `v2.0.0`,
10. create the GitHub release using `RELEASE_NOTES_v2.0.0.md`.

The script stops before publishing when a required command is missing, authentication fails, a release tag already exists, tests fail, or the work directory is not empty.

## Privacy warning

Do not add real XML backups, generated PDFs, screenshots containing private conversations, phone numbers, or test exports to the repository or release assets.
