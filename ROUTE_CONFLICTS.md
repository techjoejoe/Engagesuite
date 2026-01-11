# Route Parameter Conflict Prevention

## The Problem
Next.js doesn't allow different parameter names at the same route level:
```
❌ CONFLICT:
app/class/[classId]/page.tsx
app/class/[id]/page.tsx
```

This causes: `Error: You cannot use different slug names for the same dynamic path`

## The Solution

### 1. **Naming Convention** (see `.agent/ROUTING_CONVENTIONS.md`)
- Use `[id]` for single-parameter routes
- Use descriptive names (`[classId]`, `[workbookId]`) for multi-parameter routes
- **Never** mix parameter names at the same level

### 2. **Automated Checks**
Run before every build:
```bash
npm run check-routes
```

This automatically runs before `npm run build` via the `prebuild` script.

### 3. **Manual Check**
The script checks all dynamic routes and reports conflicts:
```bash
bash scripts/check-routes.sh
```

## Quick Reference

### Current Pattern:
- **Class routes**: `[classId]` (because they have nested routes)
- **Activity routes**: `[id]` (single resource)
- **Play routes**: `[id]` (single resource)
- **Galleries**: `[id]` (single resource)

### Before Creating New Routes:
1. Check existing sibling routes
2. Match their parameter name
3. Run `npm run check-routes` to verify

## Example
```bash
# ✅ GOOD - consistent parameter names
app/host/poll/[id]/page.tsx
app/host/poll/[id]/results/page.tsx

# ❌ BAD - mixed parameter names
app/host/poll/[id]/page.tsx
app/host/poll/[pollId]/results/page.tsx  ← WRONG!
```
