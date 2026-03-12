import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `
      select
        sr.id,
        sr.person_name,
        ws.slot_key
      from slot_registrations sr
      join weekly_slots ws on ws.id = sr.slot_id
      order by sr.created_at asc
      `
    );

    const registrations: Record<
      string,
      Array<{ id: string; person_name: string }>
    > = {};

    for (const row of result.rows) {
      if (!registrations[row.slot_key]) {
        registrations[row.slot_key] = [];
      }

      registrations[row.slot_key].push({
        id: row.id,
        person_name: row.person_name,
      });
    }

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao carregar inscrições." },
      { status: 500 }
    );
  }
}