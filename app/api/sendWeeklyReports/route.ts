// /app/api/sendWeeklyReports/route.ts
import admin from "firebase-admin";

// Initialize Admin SDK
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase environment variables are not set.");
}

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

export async function GET() {
  try {
    const usersSnapshot = await db.collection("users").get();
    const reports: any[] = [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      const logsSnapshot = await db
        .collection("users")
        .doc(userDoc.id)
        .collection("logs")
        .orderBy("createdAt", "desc")
        .get();

      // Filter logs from the last 7 days
      const recentLogs = logsSnapshot.docs.filter((logDoc) => {
        const logData = logDoc.data();
        const createdAt = logData.createdAt?.toDate?.();
        return createdAt && createdAt >= sevenDaysAgo;
      });

      if (recentLogs.length > 0 || userData.weeklyGoal) {
        // Build detailed report for all recent logs
        const logDetails = recentLogs.map((logDoc) => {
          const logData = logDoc.data();
          return `
Current Dhor: ${logData.currentDhor || "-"} (${logData.currentDhorMistakes || "0"} mistakes, ${logData.currentDhorReadQuality || "-"})
Dhor Notes: ${logData.currentDhorReadNotes || "-"}
Current Sabak: ${logData.currentSabak || "-"} (${logData.currentSabakDhorMistakes || "0"} mistakes, ${logData.currentSabakReadQuality || "-"})
Sabak Notes: ${logData.currentSabakReadNotes || "-"}
Sabak Extra Notes: ${logData.currentSabakReadNotes || "-"}
`;
        }).join("\n");

        // Weekly goal info from userData
        const weeklyGoalText = `
Weekly Goal: ${userData.weeklyGoal || "-"}
Goal Start Date: ${userData.weeklyGoalStartDateKey || "-"}
Goal Week Key: ${userData.weeklyGoalWeekKey || "-"}
Goal Completed Date: ${userData.weeklyGoalCompletedDateKey || "-"}
Goal Duration (days): ${userData.weeklyGoalDurationDays || "-"}
`;

        const reportText = `Assalaamu Alaikum

Weekly Hifdh Report
Student: ${userData.username}

📅 ${new Date().toLocaleDateString()}

${logDetails}
${weeklyGoalText}`;

        reports.push({
          student: userData.username,
          parentPhone: userData.parentPhone,
          report: reportText.trim(),
        });
      }
    }

    return new Response(JSON.stringify({ reports }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}