import { NextRequest, NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function POST(req: NextRequest) {
  const { slotKey, personName } = await req.json();

  if (!slotKey || !personName) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const slotResult = await client.query(
      `
      select id, max_people, is_blocked
      from weekly_slots
      where slot_key = $1
      `,
      [slotKey]
    );

    if ((slotResult.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Horário não encontrado." },
        { status: 404 }
      );
    }

    const slot = slotResult.rows[0];

    if (slot.is_blocked) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Este horário está bloqueado." },
        { status: 400 }
      );
    }

    const countResult = await client.query(
      `
      select count(*)::int as total
      from slot_registrations
      where slot_id = $1
      `,
      [slot.id]
    );

    if (countResult.rows[0].total >= slot.max_people) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Este horário já está completo." },
        { status: 400 }
      );
    }

    const duplicateResult = await client.query(
      `
      select 1
      from slot_registrations
      where slot_id = $1
        and lower(person_name) = lower($2)
      limit 1
      `,
      [slot.id, personName]
    );

    if ((duplicateResult.rowCount ?? 0) > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Este nome já está inscrito neste horário." },
        { status: 400 }
      );
    }

    await client.query(
      `
      insert into slot_registrations (slot_id, person_name)
      values ($1, $2)
      `,
      [slot.id, personName]
    );

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao guardar inscrição." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}