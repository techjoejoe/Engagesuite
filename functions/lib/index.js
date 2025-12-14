"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpiredClasses = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.deleteExpiredClasses = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoffString = sevenDaysAgo.toISOString().split('T')[0];
    console.log(`Running daily cleanup. Deleting classes with endDate < ${cutoffString}`);
    try {
        // Query for classes with endDate strictly less than the cutoff
        // We also filter for endDate > '2000-01-01' to avoid deleting classes with empty or invalid date strings if any
        const snapshot = await db.collection('classes')
            .where('endDate', '>', '2000-01-01')
            .where('endDate', '<', cutoffString)
            .get();
        if (snapshot.empty) {
            console.log('No expired classes found to delete.');
            return null;
        }
        console.log(`Found ${snapshot.size} classes to delete.`);
        let deletedCount = 0;
        const deletePromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            console.log(`Deleting class ${doc.id} (Name: ${data.name}, EndDate: ${data.endDate})`);
            try {
                await db.recursiveDelete(doc.ref);
                deletedCount++;
            }
            catch (err) {
                console.error(`Failed to delete class ${doc.id}:`, err);
            }
        });
        await Promise.all(deletePromises);
        console.log(`Successfully deleted ${deletedCount} classes.`);
    }
    catch (error) {
        console.error('Error in deleteExpiredClasses function:', error);
    }
    return null;
});
//# sourceMappingURL=index.js.map