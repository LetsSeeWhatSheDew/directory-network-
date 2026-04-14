# Claude Code Quickstart — CleanList

## First-time install (run once on your Mac)

```
npm install -g @anthropic-ai/claude-code
```

If npm complains about permissions:

```
sudo npm install -g @anthropic-ai/claude-code
```

Verify it worked:

```
claude --version
```

You should see something like `2.1.92 (Claude Code)`.

## Starting a session

```
cd ~/Desktop/ACTIVE/Directory-Network/Project\ -\ Directory/project-green
claude
```

## First thing to say when Claude Code opens

> Read CLAUDE.md to understand the project, then fix the deals pages — /deals/flower shows "No active deals" despite the database having 45 active deals. Diagnose the issue and fix it.

## Useful commands in Claude Code

Just describe what you want in plain English:

- "Fix the bug where..."
- "Add a feature that..."
- "Check why X isn't working"
- "Deploy this change"
- "Run the tests"
- "Show me the schema for the deals table"

## Claude Code vs this chat

- **Claude Code:** all building, debugging, file editing, terminal commands
- **Chrome:** Supabase SQL editor, Vercel dashboard, checking live pages
- **Cowork:** long autonomous 3-hour build sessions
- **Chat (claude.ai):** strategy, decisions, reviewing output

## The deals page bug (fix this first)

The file is: `app/deals/[category]/page.tsx`

The view `active_deals_with_listings` returns data when queried directly.
The Next.js page returns empty. Find out why and fix it.

## Tips

- Claude Code reads `CLAUDE.md` automatically — you don't need to tell it to.
- `.claudeignore` keeps it from walking `node_modules` and `.next` every session.
- Hit `Ctrl+C` to interrupt, `/exit` or `Ctrl+D` to quit.
- Use `/` to see slash commands.
