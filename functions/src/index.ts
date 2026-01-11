import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();

/*
export const deleteExpiredClasses = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    // ... (Code omitted for brevity) ...
    return null;
});
*/

// Sync Class Points to Lifetime Points automatically
// This resolves permission issues (Hosts can't update User profiles directly)
// and ensures consistency across all scoring methods.
export const onClassMemberUpdate = functions.firestore
    .document('classes/{classId}/members/{userId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const { userId } = context.params;

        // Check if score changed
        const newScore = newData.score || 0;
        const oldScore = oldData.score || 0;
        const delta = newScore - oldScore;

        if (delta === 0) return null;

        console.log(`Syncing lifetime points for ${userId}: delta ${delta}`);

        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);

        try {
            await userRef.set({
                lifetimePoints: admin.firestore.FieldValue.increment(delta),
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`Successfully synced lifetime points for ${userId} (Delta: ${delta})`);
        } catch (error) {
            console.error('Error syncing lifetime points:', error);
        }
        return null;
    });


export const onResponseCreated = functions.firestore
    .document('games/{gameId}/responses/{responseId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const { userId, correct, pointsEarned } = data;
        const { gameId } = context.params;

        if (!correct || !pointsEarned || pointsEarned <= 0) {
            return null;
        }

        const db = admin.firestore();

        try {
            // Get Game to find Class ID
            const gameRef = db.collection('games').doc(gameId);
            const gameSnap = await gameRef.get();

            if (!gameSnap.exists) {
                console.error(`Game ${gameId} not found`);
                return null;
            }

            const classId = gameSnap.data()?.classId;
            if (!classId) {
                console.error(`Game ${gameId} has no classId`);
                return null;
            }

            console.log(`Awarding ${pointsEarned} points to ${userId} in class ${classId}`);

            // Prepare Refs
            const memberRef = db.collection('classes').doc(classId).collection('members').doc(userId);
            const historyRef = db.collection('classes').doc(classId).collection('members').doc(userId).collection('history').doc();

            // Run Transaction
            await db.runTransaction(async (t) => {
                const memberDoc = await t.get(memberRef);

                // Update Class Member Score
                if (!memberDoc.exists) {
                    // Should exist if they joined, but fallback creation 
                    // (Note: we might miss nickname if we create it here, but better than crashing)
                    t.set(memberRef, {
                        userId,
                        classId,
                        nickname: 'Student',
                        score: pointsEarned,
                        joinedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    t.update(memberRef, {
                        score: admin.firestore.FieldValue.increment(pointsEarned)
                    });
                }



                // Add History
                t.set(historyRef, {
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    points: pointsEarned,
                    reason: 'Quiz Battle'
                });
            });

            console.log(`SUCCESS: Awarded ${pointsEarned} points to ${userId}`);
        } catch (error) {
            console.error('Error awarding points:', error);
        }

        return null;
    });
