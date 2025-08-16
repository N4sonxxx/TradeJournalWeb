const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.migrateData = functions.https.onRequest(async (req, res) => {
  // IMPORTANT: Replace this with your actual User UID
  const NEW_USER_ID = "KDy1DReiVyV2C1ryZKZ1MimvXnY2";

  if (NEW_USER_ID === "PASTE_YOUR_USER_UID_HERE") {
    functions.logger.error("User UID not set in the function code.");
    res.status(400).send(
        "Error: Please set your NEW_USER_ID in the function code.",
    );
    return;
  }

  const db = admin.firestore();
  const batch = db.batch();

  try {
    functions.logger.info(`Starting migration for user: ${NEW_USER_ID}`);

    // Migrate Trades
    const oldTradesSnapshot = await db.collection("trades").get();
    functions.logger.info(
        `Found ${oldTradesSnapshot.size} documents in 'trades'.`,
    );
    oldTradesSnapshot.forEach((doc) => {
      const newDocRef = db.doc(`users/${NEW_USER_ID}/trades/${doc.id}`);
      batch.set(newDocRef, doc.data());
    });

    // Migrate Journals
    const oldJournalsSnapshot = await db.collection("dailyJournals").get();
    functions.logger.info(
        `Found ${oldJournalsSnapshot.size} documents in 'dailyJournals'.`,
    );
    oldJournalsSnapshot.forEach((doc) => {
      const newDocRef = db.doc(
          `users/${NEW_USER_ID}/dailyJournals/${doc.id}`,
      );
      batch.set(newDocRef, doc.data());
    });

    await batch.commit();
    functions.logger.info("Migration batch committed successfully.");
    res.status(200).send("Data migration successful!");
  } catch (error) {
    functions.logger.error("Migration failed:", error);
    res.status(500).send(`Migration failed: ${error.message}`);
  }
});
