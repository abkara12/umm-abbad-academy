import type { NextApiRequest, NextApiResponse } from "next";
import admin from "firebase-admin";

// Environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase environment variables are not set.");
}

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const usersSnapshot = await db.collection("users").get();
    const reports = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      const logsSnapshot = await db
        .collection("users")
        .doc(userDoc.id)
        .collection("logs")
        .where("date", ">=", sevenDaysAgo)
        .get();

      if (!logsSnapshot.empty) {
        const reportText = `Assalaamu Alaikum\n\nWeekly Hifdh Report\nStudent: ${userData.name}\n\n📅 ${new Date().toLocaleDateString()}\n`;
        reports.push({
          student: userData.name,
          parentPhone: userData.parentPhone,
          report: reportText,
        });
      }
    }

    res.status(200).json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}