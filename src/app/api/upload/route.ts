import { NextRequest, NextResponse } from "next/server";
import { tablesDB, RETARGETING_DATABASE_ID, WORDPRESS_CUSTOMERS_TABLE_ID, ID } from "@/lib/appwrite";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser (handles quoted values with commas)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.replace(/^"|"$/g, "") || "";
    });
    rows.push(row);
  }

  return rows;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return "92" + digits.slice(1);
  }
  if (digits.length === 10) {
    return "92" + digits;
  }
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, message: "File must be a CSV" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "CSV is empty or invalid" },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let imported = 0;

    for (const row of rows) {
      try {
        const email = row.email || "";
        const phone = normalizePhone(row.phone || "");
        const firstName = row.first_name || row.fn || "";
        const lastName = row.last_name || row.ln || "";
        const city = row.ct || row.city || "";
        const value = parseFloat(row.value || "0") || 0;

        if (!phone || phone.length < 10) {
          errors.push(`Invalid phone: ${row.phone}`);
          continue;
        }

        await tablesDB.createRow({
          databaseId: RETARGETING_DATABASE_ID,
          tableId: WORDPRESS_CUSTOMERS_TABLE_ID,
          rowId: ID.unique(),
          data: {
            email,
            phone,
            first_name: firstName,
            last_name: lastName,
            city,
            value,
          },
        });

        imported++;
      } catch (err: any) {
        errors.push(`Row error: ${err.message || String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} of ${rows.length} customers`,
      count: imported,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
