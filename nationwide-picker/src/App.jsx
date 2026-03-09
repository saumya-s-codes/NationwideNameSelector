import { useState, useEffect, useRef } from "react";

const CONFETTI_COLORS = ["#FFD100", "#003087", "#ffffff", "#ffc200", "#1a4db5"];

function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    if (!active) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      particles.current = [];
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");

    particles.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;
      });
      particles.current = particles.current.filter((p) => p.y < canvas.height + 20);
      if (particles.current.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 10,
      }}
    />
  );
}

export default function App() {
  const [screen, setScreen] = useState("input"); // "input" | "picker"
  const [textInput, setTextInput] = useState("");
  const [allNames, setAllNames] = useState([]);
  const [pool, setPool] = useState([]);
  const [selected, setSelected] = useState([]);
  const [current, setCurrent] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rollingName, setRollingName] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [phase, setPhase] = useState("idle");
  const rollIntervalRef = useRef(null);

  const parsedNames = [...new Set(
    textInput.split("\n").map(n => n.trim()).filter(n => n.length > 0)
  )];

  const handleLoadNames = () => {
    if (parsedNames.length < 2) return;
    setAllNames(parsedNames);
    setPool([...parsedNames]);
    setSelected([]);
    setCurrent(null);
    setPhase("idle");
    setScreen("picker");
  };

  const handleEditNames = () => {
    setScreen("input");
    setPool([]);
    setSelected([]);
    setCurrent(null);
    setPhase("idle");
    setShowConfetti(false);
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
  };

  const pickName = () => {
    if (pool.length === 0 || rolling) return;
    setPhase("rolling");
    setRolling(true);
    setShowConfetti(false);
    setCurrent(null);

    let ticks = 0;
    const totalTicks = 28;
    rollIntervalRef.current = setInterval(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setRollingName(rand);
      ticks++;
      if (ticks >= totalTicks) {
        clearInterval(rollIntervalRef.current);
        const idx = Math.floor(Math.random() * pool.length);
        const winner = pool[idx];
        const newPool = pool.filter((_, i) => i !== idx);
        setTimeout(() => {
          setRollingName("");
          setCurrent(winner);
          setPool(newPool);
          setSelected((prev) => [winner, ...prev]);
          setRolling(false);
          setPhase("revealed");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }, 120);
      }
    }, 60);
  };

  const handleReset = () => {
    setPool([...allNames]);
    setSelected([]);
    setCurrent(null);
    setPhase("idle");
    setShowReset(false);
    setShowConfetti(false);
  };

  const remaining = pool.length;
  const allDone = remaining === 0;

  if (screen === "input") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #001a5c 0%, #003087 45%, #00205b 100%)",
        fontFamily: "'Barlow', 'DM Sans', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", position: "relative", overflow: "hidden",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .load-btn {
            background: linear-gradient(135deg, #FFD100 0%, #ffc000 100%);
            color: #001a5c; border: none; border-radius: 6px;
            font-family: 'Barlow', sans-serif; font-weight: 900;
            font-size: 1rem; letter-spacing: 0.12em; text-transform: uppercase;
            padding: 16px 44px; cursor: pointer;
            box-shadow: 0 6px 28px rgba(255,209,0,0.35);
            transition: transform 0.12s, box-shadow 0.12s, filter 0.12s; width: 100%;
          }
          .load-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
          .load-btn:disabled { opacity: 0.35; cursor: not-allowed; }
          textarea:focus { outline: none; border-color: rgba(255,209,0,0.5) !important; box-shadow: 0 0 0 3px rgba(255,209,0,0.1); }
        `}</style>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.02)", top: -150, right: -150, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.02)", bottom: -100, left: -100, pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
          <div style={{ width: 44, height: 50, clipPath: "polygon(50% 0%, 100% 18%, 100% 60%, 50% 100%, 0% 60%, 0% 18%)", background: "linear-gradient(160deg, #FFD100, #ffc200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#001a5c" }}>N</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>Nationwide</div>
            <div style={{ fontSize: "0.6rem", color: "#FFD100", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, marginTop: 3 }}>On Your Side®</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 560, boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Team Recognition Draw</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 24 }}>
            Paste your names below — one per line — then press Load Names to begin.
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>Names</label>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: parsedNames.length > 0 ? "#FFD100" : "rgba(255,255,255,0.25)", transition: "color 0.2s" }}>
              {parsedNames.length > 0 ? `${parsedNames.length} name${parsedNames.length !== 1 ? "s" : ""} detected` : "No names yet"}
            </span>
          </div>

          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={"John Smith\nJane Doe\nAlex Johnson\n..."}
            rows={12}
            style={{
              width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "14px 16px", color: "#fff",
              fontFamily: "'Barlow', sans-serif", fontSize: "0.92rem", lineHeight: 1.7,
              resize: "vertical", marginBottom: 20, display: "block", transition: "border-color 0.2s",
            }}
          />

          <button className="load-btn" onClick={handleLoadNames} disabled={parsedNames.length < 2}>
            Load {parsedNames.length > 0 ? `${parsedNames.length} ` : ""}Names & Start Draw
          </button>
          {parsedNames.length === 1 && (
            <div style={{ marginTop: 10, fontSize: "0.78rem", color: "rgba(255,150,100,0.8)", textAlign: "center" }}>Add at least 2 names to continue.</div>
          )}
        </div>
        <div style={{ marginTop: 20, fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textAlign: "center" }}>
          Duplicates are automatically removed · Names are drawn without replacement
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #001a5c 0%, #003087 45%, #00205b 100%)",
      fontFamily: "'Barlow', 'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 60px 0",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pick-btn {
          background: linear-gradient(135deg, #FFD100 0%, #ffc000 100%);
          color: #001a5c;
          border: none;
          border-radius: 6px;
          font-family: 'Barlow', sans-serif;
          font-weight: 900;
          font-size: 1.15rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 18px 52px;
          cursor: pointer;
          box-shadow: 0 6px 28px rgba(255,209,0,0.35), 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.12s, box-shadow 0.12s, filter 0.12s;
          position: relative;
          overflow: hidden;
        }
        .pick-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 10px 36px rgba(255,209,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
          filter: brightness(1.06);
        }
        .pick-btn:active:not(:disabled) { transform: scale(0.98); }
        .pick-btn:disabled {
          opacity: 0.4; cursor: not-allowed;
          background: #ccc; color: #666;
          box-shadow: none;
        }

        .reset-btn {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.6);
          border-radius: 6px;
          font-family: 'Barlow', sans-serif;
          font-weight: 600;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 22px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .reset-btn:hover { border-color: rgba(255,255,255,0.7); color: white; background: rgba(255,255,255,0.07); }

        .winner-card {
          animation: cardReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: scale(0.7) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .rolling-name {
          animation: flicker 0.06s linear infinite;
        }
        @keyframes flicker {
          0%,100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .name-tag {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 6px 14px;
          color: rgba(255,255,255,0.55);
          font-size: 0.82rem;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }
        .name-tag:first-child {
          background: rgba(255,209,0,0.12);
          border-color: rgba(255,209,0,0.3);
          color: #FFD100;
          font-weight: 600;
        }

        .shield {
          width: 36px; height: 40px;
          clip-path: polygon(50% 0%, 100% 18%, 100% 60%, 50% 100%, 0% 60%, 0% 18%);
          background: linear-gradient(160deg, #FFD100, #ffa500);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 900; color: #003087;
        }

        .bg-circle {
          position: absolute; border-radius: 50%;
          background: rgba(255,255,255,0.02);
          pointer-events: none;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: #001f5b;
          border: 1px solid rgba(255,209,0,0.3);
          border-radius: 12px;
          padding: 36px 44px;
          text-align: center;
          max-width: 360px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Background decoration */}
      <div className="bg-circle" style={{ width: 600, height: 600, top: -200, right: -200, opacity: 0.4 }} />
      <div className="bg-circle" style={{ width: 400, height: 400, bottom: -100, left: -150 }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        width: "100%",
        background: "rgba(0,10,40,0.5)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,209,0,0.2)",
        padding: "18px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "48px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="shield" style={{
            width: 40, height: 46,
            clipPath: "polygon(50% 0%, 100% 18%, 100% 60%, 50% 100%, 0% 60%, 0% 18%)",
            background: "linear-gradient(160deg, #FFD100, #ffc200)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#001a5c",
          }}>N</div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.45rem",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}>Nationwide</div>
            <div style={{
              fontSize: "0.62rem",
              color: "#FFD100",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: 2,
            }}>On Your Side®</div>
          </div>
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: 12 }}>
            Team Recognition Draw
            <button onClick={handleEditNames} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 4, padding: "5px 14px", cursor: "pointer", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Edit Names
            </button>
          </div>
      </div>

      {/* Main content */}
      <div style={{ width: "100%", maxWidth: 780, padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "36px" }}>

        {/* Counter pills */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Remaining", value: remaining, color: "#FFD100" },
            { label: "Selected", value: selected.length, color: "#7cb8ff" },
            { label: "Total", value: allNames.length, color: "rgba(255,255,255,0.4)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "12px 28px",
              textAlign: "center",
              minWidth: 110,
            }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color, fontFamily: "'Barlow', sans-serif", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Winner stage */}
        <div style={{
          width: "100%",
          minHeight: 220,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          overflow: "hidden",
          boxShadow: phase === "revealed" ? "0 0 60px rgba(255,209,0,0.12), inset 0 0 60px rgba(255,209,0,0.03)" : "none",
          transition: "box-shadow 0.6s ease",
        }}>
          <Confetti active={showConfetti} />

          {phase === "idle" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.8rem", marginBottom: 12 }}>🎯</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", fontWeight: 300, letterSpacing: "0.06em" }}>
                Press the button to draw a name
              </div>
            </div>
          )}

          {phase === "rolling" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "0.65rem",
                color: "#FFD100",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 16,
              }}>Drawing...</div>
              <div className="rolling-name" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.02em",
                minHeight: 60,
              }}>
                {rollingName}
              </div>
            </div>
          )}

          {phase === "revealed" && current && (
            <div className="winner-card" style={{ textAlign: "center", position: "relative", zIndex: 5 }}>
              <div style={{
                fontSize: "0.65rem",
                color: "#FFD100",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 800,
                marginBottom: 14,
              }}>✦ Selected ✦</div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 6vw, 3.4rem)",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "0.01em",
                lineHeight: 1.1,
                textShadow: "0 0 40px rgba(255,209,0,0.4), 0 2px 20px rgba(0,0,0,0.5)",
              }}>
                {current}
              </div>
              <div style={{
                marginTop: 16,
                display: "inline-block",
                background: "linear-gradient(135deg, #FFD100, #ffc200)",
                borderRadius: "20px",
                padding: "4px 18px",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#001a5c",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>Winner</div>
            </div>
          )}

          {allDone && phase !== "rolling" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏆</div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#FFD100",
                marginBottom: 6,
              }}>All Names Drawn!</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Every team member has been selected.</div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <button
            className="pick-btn"
            onClick={pickName}
            disabled={rolling || allDone}
          >
            {rolling ? "Drawing..." : allDone ? "All Done" : "Draw a Name"}
          </button>
          <button className="reset-btn" onClick={() => setShowReset(true)}>
            Reset All Names
          </button>
        </div>

        {/* Previously selected */}
        {selected.length > 0 && (
          <div style={{ width: "100%" }}>
            <div style={{
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>Previously Selected — {selected.length} name{selected.length !== 1 ? "s" : ""}</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "8px",
              maxHeight: 280,
              overflowY: "auto",
              paddingRight: 4,
            }}>
              {selected.map((name, i) => (
                <div key={name} className="name-tag">
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: i === 0 ? "rgba(255,209,0,0.2)" : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", fontWeight: 700,
                    color: i === 0 ? "#FFD100" : "rgba(255,255,255,0.3)",
                    flexShrink: 0,
                  }}>{selected.length - i}</span>
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reset Modal */}
      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "white",
              marginBottom: 10,
            }}>Reset the Draw?</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", marginBottom: 28, lineHeight: 1.6 }}>
              This will restore all {allNames.length} names and clear the selection history.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowReset(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  borderRadius: 6,
                  padding: "10px 24px",
                  cursor: "pointer",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                }}
              >Cancel</button>
              <button
                onClick={handleReset}
                style={{
                  background: "linear-gradient(135deg, #FFD100, #ffc200)",
                  border: "none",
                  color: "#001a5c",
                  borderRadius: 6,
                  padding: "10px 24px",
                  cursor: "pointer",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
