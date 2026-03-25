import admin from "firebase-admin";
import Twilio from "twilio";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase environment variables are not set.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

      const recentLogs = logsSnapshot.docs.filter((logDoc) => {
        const logData = logDoc.data();
        const createdAt = logData.createdAt;
        if (!createdAt) return false;
        const logDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return logDate >= sevenDaysAgo;
      });

      let monthLabel = "";

      if (recentLogs.length > 0) {
        const firstLog = recentLogs[0].data();
        const d = firstLog.createdAt?.toDate
          ? firstLog.createdAt.toDate()
          : new Date();

        monthLabel = d.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      let reportText = `السلام عليكم ورحمة الله وبركاته

📖 Weekly Hifdh Report
Student: ${userData.username}
Ustad: Moulana Shaheed Bhabha
Month: ${monthLabel}

`;

      if (recentLogs.length > 0) {
        recentLogs.forEach((logDoc, index) => {
          const logData = logDoc.data();

          const dateObj = logData.createdAt?.toDate
            ? logData.createdAt.toDate()
            : new Date();

          const dayName = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
          });

          const dateFormatted = dateObj.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          });

          reportText += `${dayName} ${dateFormatted}

Sabak: ${logData.sabak ?? "-"} | ${logData.sabakReadQuality ?? "-"}`;

          if (logData.sabakReadNotes) {
            reportText += `\nNote: ${logData.sabakReadNotes}`;
          }

          reportText += `

Sabak Dhor: ${logData.sabakDhor ?? "-"} | ${
            logData.sabakDhorReadQuality ?? "-"
          }`;

          if (logData.sabakDhorReadNotes) {
            reportText += `\nNote: ${logData.sabakDhorReadNotes}`;
          }

          reportText += `

Dhor: ${logData.dhor ?? "-"} | ${logData.dhorReadQuality ?? "-"}`;

          if (logData.dhorReadNotes) {
            reportText += `\nNote: ${logData.dhorReadNotes}`;
          }

          reportText += `

Mistakes: Sabak Dhor ${logData.sabakDhorMistakes ?? "0"} | Dhor ${
            logData.dhorMistakes ?? "0"
          }

`;

          if (index !== recentLogs.length - 1) {
            reportText += `──────────\n\n`;
          }
        });

        const latestLog = recentLogs[0].data();

        const goalStatus = latestLog.weeklyGoalCompleted
          ? "Completed"
          : "In Progress";

        reportText += `🎯 Weekly Goal: ${latestLog.weeklyGoal ?? "-"}
📊 Goal Status: ${goalStatus}
Duration: ${latestLog.weeklyGoalDurationDays ?? "-"}

────────────────

Powered by The Hifdh Journal`;
      } else {
        reportText += `No logs recorded for the last 7 days.

────────────────

Powered by The Hifdh Journal`;
      }

      reports.push({
        student: userData.username,
        parentPhone: userData.parentPhone,
        report: reportText.trim(),
      });

      // if (userData.parentPhone) {
      //   await twilioClient.messages.create({
      //     from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      //     to: `whatsapp:${userData.parentPhone}`,
      //     body: reportText.trim(),
      //   });
      // }
    }

    return new Response(JSON.stringify({ reports, sent: true }), {
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