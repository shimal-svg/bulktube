import { createAdminClient } from "@/lib/supabase/admin";

const SPREADSHEET_TITLE = "drrop.io Uploads";
const SHEET_TAB = "Uploads";
const HEADERS = [
  "Upload Date",
  "Filename",
  "Title",
  "Orientation",
  "Duration",
  "Duration (seconds)",
  "Privacy",
  "Video ID",
  "YouTube URL",
  "Status",
];

export interface UploadRowData {
  uploadDate: string; // YYYY-MM-DD ISO 8601
  filename: string;
  title: string;
  orientation: string | null;
  duration: number | null; // seconds (human-readable column)
  durationSeconds: number | null; // seconds (raw integer column)
  privacy: string;
  videoId: string;
  youtubeUrl: string;
  status: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, "0")}s` : `${s}s`;
}

export async function ensureSheet(
  userId: string,
  accessToken: string
): Promise<{ sheetId: string; sheetUrl: string }> {
  const admin = createAdminClient();

  const { data: userData, error: fetchError } = await admin
    .from("users")
    .select("google_sheets_id, google_sheets_url")
    .eq("id", userId)
    .single();

  console.log(
    "[sheets/ensureSheet] existing —",
    "sheetId:", userData?.google_sheets_id ?? "none",
    "| fetchError:", fetchError ? JSON.stringify(fetchError) : "none"
  );

  if (userData?.google_sheets_id && userData?.google_sheets_url) {
    return {
      sheetId: userData.google_sheets_id,
      sheetUrl: userData.google_sheets_url,
    };
  }

  // Create a new spreadsheet with a header row
  console.log("[sheets/ensureSheet] creating new spreadsheet...");
  const createRes = await fetch(
    "https://sheets.googleapis.com/v4/spreadsheets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { title: SPREADSHEET_TITLE },
        sheets: [
          {
            properties: { title: SHEET_TAB },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: HEADERS.map((h) => ({
                      userEnteredValue: { stringValue: h },
                      userEnteredFormat: {
                        textFormat: { bold: true },
                      },
                    })),
                  },
                ],
              },
            ],
          },
        ],
      }),
    }
  );

  console.log("[sheets/ensureSheet] Sheets API create status:", createRes.status);

  if (!createRes.ok) {
    const err = await createRes.text().catch(() => "");
    throw new Error(`Sheets API create failed: ${createRes.status} ${err}`);
  }

  const sheet = await createRes.json();
  const sheetId: string = sheet.spreadsheetId;
  const sheetUrl: string = sheet.spreadsheetUrl;

  console.log("[sheets/ensureSheet] created — sheetId:", sheetId, "| sheetUrl:", sheetUrl);

  const { error: saveError } = await admin
    .from("users")
    .update({ google_sheets_id: sheetId, google_sheets_url: sheetUrl })
    .eq("id", userId);

  console.log("[sheets/ensureSheet] DB save error:", saveError ? JSON.stringify(saveError) : "none");

  if (saveError) {
    throw new Error(`Failed to save sheet ID to DB: ${saveError.message}`);
  }

  return { sheetId, sheetUrl };
}

export async function appendUploadRow(
  sheetId: string,
  accessToken: string,
  row: UploadRowData
): Promise<void> {
  const values = [
    row.uploadDate,
    row.filename,
    row.title,
    row.orientation ?? "",
    formatDuration(row.duration),
    row.durationSeconds ?? "",
    row.privacy,
    row.videoId,
    row.youtubeUrl,
    row.status,
  ];

  console.log("[sheets/appendUploadRow] appending to sheetId:", sheetId);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
      SHEET_TAB + "!A1"
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [values] }),
    }
  );

  console.log("[sheets/appendUploadRow] status:", res.status);

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Sheets API append failed: ${res.status} ${err}`);
  }
}
