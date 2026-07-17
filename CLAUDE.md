@AGENTS.md

# ENVIRONMENT (read every session)
- Repo: C:\Users\Thoma\projects\apps\jawease — the ONLY repo you touch. Never edit files outside it.
- OS: Windows. Shell: CMD (Command Prompt), not PowerShell or bash.
- CMD syntax: type (not cat), del (not rm), rmdir /s /q (not rm -rf), %VAR% for env vars, \ for paths. One command per line — avoid && chaining.
- tsc, git, npm, npx are shell-agnostic — run them normally.
- NEVER run eas commands (build, submit, login, init). EAS can't authenticate here — Dan runs all eas commands from local PowerShell. If a build/submit is needed, tell Dan; don't attempt it.
- Developer: Dan Johnson. dan@listinglab.pro.
