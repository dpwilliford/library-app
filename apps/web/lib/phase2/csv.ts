export type CsvRow = Record<string, string>;

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (character === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (character === "\"") {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === "\"") {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [rawHeaders, ...rawRows] = rows.filter((items) => items.some((item) => item.trim() !== ""));
  const headers = (rawHeaders ?? []).map((header) => header.trim());
  const dataRows = rawRows.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header, (items[index] ?? "").trim()]))
  );

  return { headers, rows: dataRows };
}

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function escapeCsvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

