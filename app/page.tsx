"use client";

import { useEffect, useMemo, useState } from "react";

type WeeklyTurn = {
  key: string;
  label: string;
  note: string;
};

type WeeklySlot = {
  period: string;
  time: string;
  key: string;
};

type RegistrationItem = {
  id: string;
  person_name: string;
};

type RegistrationsMap = Record<string, RegistrationItem[]>;

const MAX_PEOPLE_PER_SLOT = 3;

const weeklyTurns: WeeklyTurn[] = [
  { key: "segunda", label: "Segunda-feira", note: "manhã e tarde disponíveis" },
  { key: "terca", label: "Terça-feira", note: "manhã e tarde disponíveis" },
  {
    key: "quarta",
    label: "Quarta-feira",
    note: "todos os horários disponíveis, exceto 20:00 às 21:00",
  },
  { key: "quinta", label: "Quinta-feira", note: "manhã e tarde disponíveis" },
  { key: "sexta", label: "Sexta-feira", note: "manhã e tarde disponíveis" },
];

const weeklySlots: WeeklySlot[] = [
  { period: "Manhã", time: "06:00 às 07:00", key: "06:00-07:00" },
  { period: "Manhã", time: "07:00 às 08:00", key: "07:00-08:00" },
  { period: "Manhã", time: "08:00 às 09:00", key: "08:00-09:00" },
  { period: "Tarde", time: "18:00 às 19:00", key: "18:00-19:00" },
  { period: "Tarde", time: "19:00 às 20:00", key: "19:00-20:00" },
  { period: "Tarde", time: "20:00 às 21:00", key: "20:00-21:00" },
];

export default function Page() {
  const [registrations, setRegistrations] = useState<RegistrationsMap>({});
  const [selectedTurnKey, setSelectedTurnKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingRegistrationKey, setPendingRegistrationKey] = useState<string | null>(null);
  const [pendingSlotLabel, setPendingSlotLabel] = useState("");
  const [typedName, setTypedName] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTurn = useMemo(
    () => weeklyTurns.find((turn) => turn.key === selectedTurnKey) ?? null,
    [selectedTurnKey]
  );

  const groupedSlots = useMemo(() => {
    return weeklySlots.reduce<Record<string, WeeklySlot[]>>((acc, slot) => {
      if (!acc[slot.period]) acc[slot.period] = [];
      acc[slot.period].push(slot);
      return acc;
    }, {});
  }, []);

  async function loadRegistrations() {
    const response = await fetch("/api/slots", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar inscrições.");
    }

    setRegistrations(data.registrations || {});
  }

  function openNameModal(registrationKey: string, slotLabel: string) {
    setPendingRegistrationKey(registrationKey);
    setPendingSlotLabel(slotLabel);
    setTypedName("");
    setIsModalOpen(true);
  }

  function closeNameModal() {
    setPendingRegistrationKey(null);
    setPendingSlotLabel("");
    setTypedName("");
    setIsModalOpen(false);
  }

  async function saveRegistration() {
    const name = typedName.trim();
    if (!name || !pendingRegistrationKey) return;

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotKey: pendingRegistrationKey,
          personName: name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao guardar inscrição.");
        return;
      }

      await loadRegistrations();
      closeNameModal();
    } catch (error) {
      console.error(error);
      alert("Erro ao guardar inscrição.");
    } finally {
      setLoading(false);
    }
  }

  async function removeRegistration(registrationId: string) {
    setLoading(true);

    try {
      const response = await fetch("/api/delete-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao apagar inscrição.");
        return;
      }

      await loadRegistrations();
    } catch (error) {
      console.error(error);
      alert("Erro ao apagar inscrição.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations().catch((error) => {
      console.error(error);
      alert("Não foi possível carregar os dados do banco.");
    });
  }, []);

  return (
    <>
      <style jsx global>{`
        header {
          position: relative;
          min-height: 34vh;
          background-image: url('https://storage2.snappages.site/2CD49G/assets/images/11060006_2160x976_2500.png');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: end;
          justify-content: center;
          padding: calc(env(safe-area-inset-top, 0px) + 1.5rem) 1rem 1.25rem;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
        }

        .gradient {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 170px;
          background: linear-gradient(to bottom, rgba(2, 22, 30, 0), rgba(2, 22, 30, 1));
        }

        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          width: 100%;
          max-width: 760px;
        }

        h1 {
          font-size: 1.72rem;
          font-weight: 600;
          line-height: 1.18;
          margin-bottom: 0.7rem;
        }

        .month-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          border: 1px solid rgba(255,255,255,0.26);
          border-radius: 999px;
          padding: 0.65rem 1rem;
          font-size: 0.84rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          backdrop-filter: blur(6px);
        }

        main {
          position: relative;
          z-index: 1;
          width: min(100%, 980px);
          margin: 0 auto;
          padding: 1rem 0.9rem calc(2rem + env(safe-area-inset-bottom, 0px));
        }

        .intro-card,
        .turn-card,
        .slot-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          backdrop-filter: blur(8px);
          padding: 0.95rem;
        }

        .intro-card,
        .turn-card {
          margin-bottom: 0.9rem;
        }

        .leader-links {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.95rem;
        }

        .leader-link-card {
          display: block;
          text-decoration: none;
          color: inherit;
          border: 1px solid var(--border);
          background: var(--card-strong);
          border-radius: 16px;
          padding: 0.9rem;
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
        }

        .leader-link-card:hover,
        .leader-link-card:focus-visible {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.12);
          outline: none;
        }

        .leader-link-title {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.35;
          margin-bottom: 0.25rem;
        }

        .leader-link-subtitle {
          display: block;
          font-size: 0.84rem;
          line-height: 1.45;
          color: var(--muted);
        }

        .turn-card h2,
        .selected-turn h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
        }

        .turn-card p,
        .selected-turn p,
        .empty-state {
          color: var(--muted);
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .turn-grid {
          display: grid;
          gap: 0.7rem;
          margin-top: 0.95rem;
        }

        .turn-button {
          width: 100%;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          min-height: 72px;
          padding: 0.9rem;
          text-align: left;
          color: var(--text);
          font-family: inherit;
          cursor: pointer;
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
        }

        .turn-button:hover,
        .turn-button:focus-visible {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.34);
          outline: none;
        }

        .turn-button.selected {
          border-color: var(--accent);
          background: rgba(216,195,165,0.14);
          box-shadow: inset 0 0 0 1px rgba(216,195,165,0.2);
        }

        .turn-day {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }

        .turn-note {
          display: block;
          font-size: 0.84rem;
          color: var(--muted);
          line-height: 1.35;
        }

        .selected-turn {
          margin-bottom: 0.9rem;
        }

        .period-title {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
          margin: 1rem 0 0.65rem;
          font-weight: 700;
        }

        .slot-list {
          display: grid;
          gap: 0.7rem;
        }

        .slot-item {
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 0.82rem;
        }

        .slot-item.top-disabled {
          opacity: 0.58;
        }

        .slot-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.65rem;
          margin-bottom: 0.75rem;
        }

        .slot-time {
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1.25;
        }

        .slot-capacity {
          font-size: 0.76rem;
          color: var(--muted);
          margin-top: 0.22rem;
        }

        .slot-status {
          border-radius: 999px;
          padding: 0.34rem 0.56rem;
          font-size: 0.7rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.18);
          flex-shrink: 0;
        }

        .slot-status.available {
          color: var(--success);
          border-color: rgba(149,213,178,0.35);
          background: rgba(149,213,178,0.12);
        }

        .slot-status.full {
          color: var(--danger);
          border-color: rgba(246,189,192,0.35);
          background: rgba(246,189,192,0.1);
        }

        .assigned-list {
          list-style: none;
          display: grid;
          gap: 0.42rem;
          margin-bottom: 0.8rem;
        }

        .assigned-list li {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          color: var(--muted);
          font-size: 0.88rem;
          line-height: 1.35;
          word-break: break-word;
        }

        .assigned-list li::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.32);
          flex: 0 0 auto;
        }

        .assigned-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          width: 100%;
        }

        .assigned-name {
          flex: 1;
          min-width: 0;
        }

        .delete-name-btn {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.04);
          color: var(--text);
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          flex: 0 0 auto;
        }

        .delete-name-btn:hover,
        .delete-name-btn:focus-visible {
          background: rgba(246,189,192,0.12);
          border-color: rgba(246,189,192,0.35);
          outline: none;
        }

        .slot-actions {
          display: grid;
          gap: 0.45rem;
        }

        .action-btn {
          width: 100%;
          min-height: var(--tap);
          border-radius: 13px;
          border: 0;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.16s ease, opacity 0.16s ease;
          padding: 0.85rem 1rem;
        }

        .action-btn:hover,
        .action-btn:focus-visible {
          transform: translateY(-1px);
          outline: none;
        }

        .action-btn.primary {
          background: var(--accent);
          color: #1f1913;
        }

        .action-btn.secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
        }

        .action-btn:disabled {
          opacity: 0.42;
          cursor: not-allowed;
          transform: none;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: none;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 50;
        }

        .modal-backdrop.open {
          display: flex;
        }

        .modal {
          width: min(100%, 420px);
          background: #0d2530;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1rem;
          box-shadow: var(--shadow);
        }

        .modal h4 {
          font-size: 1rem;
          margin-bottom: 0.35rem;
        }

        .modal p {
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.45;
          margin-bottom: 0.9rem;
        }

        .modal input {
          width: 100%;
          min-height: 48px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.04);
          color: var(--text);
          padding: 0.85rem 0.95rem;
          font-family: inherit;
          font-size: 0.95rem;
          margin-bottom: 0.85rem;
        }

        .modal input::placeholder {
          color: rgba(255,255,255,0.45);
        }

        .modal-actions {
          display: grid;
          gap: 0.5rem;
        }

        @media (max-width: 420px) {
          main {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }

          h1 {
            font-size: 1.52rem;
          }

          .slot-head {
            flex-direction: column;
            gap: 0.45rem;
          }

          .slot-status {
            align-self: flex-start;
          }
        }

        @media (min-width: 768px) {
          header {
            min-height: 48vh;
            padding-bottom: 1.8rem;
          }

          h1 {
            font-size: 2.55rem;
          }

          main {
            padding-top: 1.5rem;
          }

          .intro-card,
          .turn-card,
          .slot-card {
            padding: 1.2rem;
          }

          .turn-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .slot-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <header>
        <div className="overlay" />
        <div className="gradient" />
        <div className="hero-content">
          <h1>Líderes relógio de oração | Líderes sala de oração</h1>
          <div className="month-badge">40 dias em Sião • VDS’26</div>
        </div>
      </header>

      <main>
        <section className="intro-card">
          <div className="leader-links">
            <a
              className="leader-link-card"
              href="https://chat.whatsapp.com/K7pYWrObG2q5gLfQt5Z9dZ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="leader-link-title">
                VDS&apos;26 | Líderes Sala de Oração (presencial)
              </span>
              <span className="leader-link-subtitle">
                Entra diretamente no grupo de WhatsApp correspondente
              </span>
            </a>

            <a
              className="leader-link-card"
              href="https://chat.whatsapp.com/Kt4z4eYaliDKwJpKHFOd0R"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="leader-link-title">
                VDS&apos;26 | Líderes Relógio de Oração (on-line)
              </span>
              <span className="leader-link-subtitle">
                Entra diretamente no grupo de WhatsApp correspondente
              </span>
            </a>
          </div>
        </section>

        <section className="turn-card">
          <h2>Escolhe o dia da semana</h2>
          <p>A inscrição fica fixa no mesmo horário desse turno, semana após semana.</p>

          <div className="turn-grid">
            {weeklyTurns.map((turn) => (
              <button
                key={turn.key}
                type="button"
                className={`turn-button ${selectedTurnKey === turn.key ? "selected" : ""}`}
                onClick={() => setSelectedTurnKey(turn.key)}
              >
                <span className="turn-day">{turn.label}</span>
                <span className="turn-note">{turn.note}</span>
              </button>
            ))}
          </div>
        </section>

        {selectedTurn && (
          <section className="slot-card" id="slotCard">
            <div className="selected-turn">
              <h3>{selectedTurn.label}</h3>
              <p>Cada horário aceita até 3 pessoas.</p>
            </div>

            <div id="slotSections">
              {Object.entries(groupedSlots).map(([period, slots]) => (
                <div key={period}>
                  <div className="period-title">{period}</div>

                  <div className="slot-list">
                    {slots.map((slot) => {
                      const isWednesdayBlockedSlot =
                        selectedTurn.key === "quarta" && slot.key === "20:00-21:00";

                      const registrationKey = `${selectedTurn.key}|${slot.key}`;
                      const names = registrations[registrationKey] || [];
                      const isFull = names.length >= MAX_PEOPLE_PER_SLOT;
                      const available = MAX_PEOPLE_PER_SLOT - names.length;

                      return (
                        <div
                          key={registrationKey}
                          className={`slot-item ${
                            isFull || isWednesdayBlockedSlot ? "top-disabled" : ""
                          }`}
                        >
                          <div className="slot-head">
                            <div>
                              <div className="slot-time">{slot.time}</div>
                              <div className="slot-capacity">
                                {names.length}/{MAX_PEOPLE_PER_SLOT} pessoas inscritas
                              </div>
                            </div>

                            <div
                              className={`slot-status ${
                                isFull || isWednesdayBlockedSlot ? "full" : "available"
                              }`}
                            >
                              {isWednesdayBlockedSlot
                                ? "Indisponível"
                                : isFull
                                ? "Completo"
                                : `${available} vaga${available > 1 ? "s" : ""}`}
                            </div>
                          </div>

                          {names.length > 0 ? (
                            <ul className="assigned-list">
                              {names.map((item) => (
                                <li key={item.id}>
                                  <div className="assigned-row">
                                    <span className="assigned-name">{item.person_name}</span>
                                    <button
                                      className="delete-name-btn"
                                      type="button"
                                      aria-label={`Apagar ${item.person_name}`}
                                      onClick={() => removeRegistration(item.id)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="empty-state">
                              {isWednesdayBlockedSlot
                                ? "Este horário não fica disponível nas quartas-feiras às 20:00."
                                : "Ainda não há ninguém inscrito neste horário."}
                            </p>
                          )}

                          <div className="slot-actions">
                            <button
                              className="action-btn primary"
                              type="button"
                              disabled={isFull || isWednesdayBlockedSlot || loading}
                              onClick={() =>
                                openNameModal(
                                  registrationKey,
                                  `${slot.time} • ${selectedTurn.label}`
                                )
                              }
                            >
                              {isWednesdayBlockedSlot
                                ? "Indisponível na quarta às 20:00"
                                : "Inscrever neste horário"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className={`modal-backdrop ${isModalOpen ? "open" : ""}`} aria-hidden={!isModalOpen}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="nameModalTitle">
          <h4 id="nameModalTitle">Inscrever neste horário</h4>
          <p id="nameModalDescription">
            Digite o seu nome para entrar no horário {pendingSlotLabel}.
          </p>
          <input
            type="text"
            placeholder="Seu nome"
            maxLength={50}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRegistration();
              if (e.key === "Escape") closeNameModal();
            }}
          />
          <div className="modal-actions">
            <button
              className="action-btn primary"
              type="button"
              onClick={saveRegistration}
              disabled={loading}
            >
              Guardar inscrição
            </button>
            <button
              className="action-btn secondary"
              type="button"
              onClick={closeNameModal}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}