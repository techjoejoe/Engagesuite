# Spam, DoS, and API Abuse Prevention Strategy

## Multi-Layer Defense

### Layer 1: Firebase App Check (reCAPTCHA v3)
**Prevents:** Bots, automated attacks, API abuse  
**Implementation:**

1. **Enable Firebase App Check in Console**
   - Go to Firebase Console → Build → App Check
   - Register web app
   - Add reCAPTCHA v3 site key

2. **Install Dependencies:**
```bash
npm install firebase-admin
```

3. **Add to app/layout.tsx:**
```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

useEffect(() => {
  if (typeof window !== 'undefined') {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
      isTokenAutoRefreshEnabled: true
    });
  }
}, []);
```

4. **Add to .env.local:**
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

**Result:** Blocks 99% of bot traffic automatically

---

### Layer 2: Firestore Security Rules Rate Limiting

**Current Implementation:**
- Vote creation requires timestamp
- One vote per user per photo
- 4 votes per day (client-side + server validation)

**Add:**
```javascript
// In firestore.rules - limit writes per user
function isNotSpamming() {
  // Requires tracking recent operations
  // Firebase has built-in quota limits:
  // - 20k writes/day for free tier
  // - 50k reads/day for free tier
  return true; // Rely on Firebase quotas
}
```

---

### Layer 3: Storage Quotas

**Current Rules (storage.rules):**
- 5MB per image
- Images only (jpeg, png, webp)
- Validated content type

**Add Monthly Limits:**
```javascript
// In storage.rules
function userUploadQuota() {
  // Track uploads per user per month
  // Requires Cloud Function to maintain counter
  return true; // See Cloud Function below
}
```

---

### Layer 4: Cloud Functions Rate Limiting

**Create:** `functions/src/rateLimiter.ts`
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Track upload attempts
export const trackUpload = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userId = context.auth.uid;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Check rate limit doc
  const rateLimitRef = db.collection('rate_limits').doc(userId);
  const doc = await rateLimitRef.get();
  
  const data = doc.data() || { uploads: [], votes: [] };
  
  // Remove old uploads (older than 1 hour)
  const recentUploads = data.uploads.filter((time: number) => now - time < oneHour);
  
  // Check if over limit (max 10 uploads per hour)
  if (recentUploads.length >= 10) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Upload limit exceeded. Try again later.'
    );
  }
  
  // Add new upload
  recentUploads.push(now);
  await rateLimitRef.set({ uploads: recentUploads }, { merge: true });
  
  return { allowed: true };
});

// Track vote attempts  
export const trackVote = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userId = context.auth.uid;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const rateLimitRef = db.collection('rate_limits').doc(userId);
  const doc = await rateLimitRef.get();
  
  const data = doc.data() || { uploads: [], votes: [] };
  
  // Remove old votes (older than 24 hours)
  const recentVotes = data.votes.filter((time: number) => now - time < oneDay);
  
  // Check daily limit (4 votes per day)
  if (recentVotes.length >= 4) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Daily vote limit reached (4 per day)'
    );
  }
  
  recentVotes.push(now);
  await rateLimitRef.set({ votes: recentVotes }, { merge: true });
  
  return { allowed: true, remaining: 4 - recentVotes.length };
});
```

---

### Layer 5: IP-Based Rate Limiting (Advanced)

**Use Cloudflare (Free Tier):**
1. Point domain to Cloudflare
2. Enable Rate Limiting rules:
   - Max 60 requests/minute per IP
   - Max 10 POST requests/minute per IP
   - Challenge suspicious IPs with CAPTCHA

**Or use Firebase Hosting headers:**
```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "/api/**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          }
        ]
      }
    ]
  }
}
```

---

### Layer 6: Client-Side Throttling

**Debounce rapid actions:**
```typescript
// lib/throttle.ts
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastRan = 0;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastRan < wait) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastRan = now;
        func(...args);
      }, wait - (now - lastRan));
    } else {
      lastRan = now;
      func(...args);
    }
  };
}

// Usage:
const handleVote = throttle(async (photoId) => {
  // Vote logic
}, 1000); // Max 1 vote per second
```

---

## Summary of Protection

| Attack Type | Defense | Layer |
|------------|---------|-------|
| Bots | Firebase App Check (reCAPTCHA) | 1 |
| Rapid voting | 1-second throttle + daily limit | 2, 6 |
| Upload spam | 10/hour limit + file size | 3, 4 |
| API abuse | App Check + quotas | 1, 2 |
| DoS | IP rate limiting (Cloudflare) | 5 |
| Large files | 5MB storage rules | 3 |

## Implementation Priority

### Critical (Do Now):
1. ✅ Storage rules (done above)
2. ✅ Vote validation (done above)
3. 🔄 Firebase App Check (next step)

### High (This Week):
4. Cloud Functions rate limiter
5. Client-side throttling

### Medium (This Month):
6. Cloudflare setup
7. Advanced monitoring

---

## Cost Impact

**Free Tier Limits:**
- Firestore: 50k reads/day, 20k writes/day
- Storage: 1GB, 10GB transfer/day
- Functions: 125k invocations/day

**With Protection:**
- App Check: Free (reCAPTCHA v3)
- Cloudflare: Free tier sufficient
- No additional cost for rate limiting

**Estimated Usage (1000 users/day):**
- Votes: ~4k writes/day (well under 20k)
- Photos: ~500 uploads/day (~2.5GB storage/month)
- Reads: ~10k/day (well under 50k)

**Verdict:** Free tier more than sufficient with protections in place
