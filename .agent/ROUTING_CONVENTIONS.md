# Routing Conventions

## Dynamic Route Parameter Naming

### ✅ Rules:

1. **Single Parameter Routes**: Use `[id]`
   ```
   app/resource/[id]/page.tsx
   ```

2. **Multiple Parameters**: Use descriptive names
   ```
   app/class/[classId]/workbook/[workbookId]/page.tsx
   ```

3. **Never mix parameter names at the same level**
   ```
   ❌ BAD:
   app/class/[classId]/page.tsx
   app/class/[id]/page.tsx  ← CONFLICT!
   
   ✅ GOOD:
   app/class/[classId]/page.tsx  (only one)
   ```

### Current Routes Audit (2026-01-06):

#### Host Routes:
- `app/host/class/[classId]/*` - Uses classId (has nested routes)
- `app/host/poll/[id]/*` - Uses id
- `app/host/quizbattle/*/[id]` - Uses id
- `app/host/tickr/[id]` - Uses id
- `app/host/wordstorm/[id]` - Uses id
- `app/host/leadergrid/[classId]` - Uses classId
- `app/host/parkinglot/[classId]` - Uses classId

#### Play Routes:
- `app/play/class/[id]` - Uses id
- `app/play/album/[id]` - Uses id
- `app/play/poll/[id]` - Uses id
- `app/play/quizbattle/*/[id]` - Uses id
- `app/play/tickr/[id]` - Uses id
- `app/play/wordstorm/[id]` - Uses id

#### PicPick Routes:
- `app/picpick/admin/gallery/[id]` - Uses id
- `app/picpick/gallery/[id]` - Uses id

#### Dashboard Routes:
- `app/dashboard/class/[classId]` - Uses classId

### Why This Pattern?

- **Class routes use `[classId]`** because they often have nested routes with other IDs
- **Activity routes use `[id]`** because they're single-resource routes
- **Consistency prevents Next.js conflicts**

### Before Creating New Routes:

1. Check if route parent already exists
2. Match the parameter name of sibling routes
3. Never create `[id]` and `[classId]` at the same level

### Automated Check:

Run this to check for conflicts:
```bash
find app -type d -name '\[*\]' | 
  sed 's/.*\///' | 
  sort | 
  uniq -c | 
  awk '$1 > 1 {print "⚠️  Potential conflict:", $2}'
```
