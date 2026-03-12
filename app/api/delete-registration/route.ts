import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { registrationId } = await req.json();

  if (!registrationId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await pool.query(
      `
      delete from slot_registrations
      where id = $1
      `,
      [registrationId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao apagar inscrição." },
      { status: 500 }
    );
  }
}