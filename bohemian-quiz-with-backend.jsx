import { useState } from "react";

// ── CONFIGURE THIS to your backend URL ──
const API_URL = "http://localhost:3000";

const questions = [
  {
    id: 1,
    type: "multiple",
    question: "Your ideal Friday night looks like…",
    options: [
      "An underground poetry slam or live jazz in a dimly lit bar",
      "Netflix on the couch with takeout",
      "A house party with a curated vinyl playlist and homemade sangria",
      "Dinner at a trendy new restaurant with reservations",
    ],
  },
  {
    id: 2,
    type: "multiple",
    question: "How would you describe your personal style?",
    options: [
      "Layered, thrifted, expressive — rules are suggestions",
      "Clean, minimal, and put-together",
      "Athleisure all day every day",
      "Whatever's comfortable and on sale",
    ],
  },
  {
    id: 3,
    type: "text",
    question: "Describe your dream living space in a few words.",
    placeholder: "e.g. A converted warehouse with plants everywhere…",
  },
  {
    id: 4,
    type: "multiple",
    question: "Pick the travel destination that calls to you most:",
    options: [
      "A remote artist residency in Portugal",
      "An all-inclusive resort in Cancún",
      "Backpacking through Southeast Asia with no itinerary",
      "A guided tour of European capitals",
    ],
  },
  {
    id: 5,
    type: "multiple",
    question: 'Your relationship with "the system" (career, society, norms):',
    options: [
      "I actively resist it — I carve my own path",
      "I work within it but bend the rules when I can",
      "I'm pretty comfortable following the conventional route",
      "What system? I haven't thought about it much",
    ],
  },
  {
    id: 6,
    type: "text",
    question:
      "What's one thing you own that most people would find weird or useless?",
    placeholder: "e.g. A taxidermy crow named Edgar…",
  },
  {
    id: 7,
    type: "multiple",
    question: "Your music taste is best described as:",
    options: [
      "Eclectic — I jump from Fleetwood Mac to Khruangbin to Afrobeat",
      "Mainstream pop and whatever's trending",
      "One genre deep — I know every artist in my lane",
      "I honestly just listen to whatever's on the radio",
    ],
  },
  {
    id: 8,
    type: "text",
    question: "If money didn't matter, what would you spend your life doing?",
    placeholder: "e.g. Painting murals across South America…",
  },
];

const bohemianFont = "Playfair Display";
const bodyFont = "Libre Baskerville";

export default function BohemianQuiz() {
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  const transition = (callback) => {
    setFadeIn(false);
    setTimeout(() => {
      callback();
      setFadeIn(true);
    }, 350);
  };

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [questions[current].id]: answer };
    setAnswers(newAnswers);
    if (current < questions.length - 1) {
      transition(() => {
        setCurrent(current + 1);
        setTextInput("");
      });
    } else {
      submitQuiz(newAnswers);
    }
  };

  // ── Submit to Claude for judging, then save to backend ──
  const submitQuiz = async (finalAnswers) => {
    setLoading(true);
    const formatted = questions
      .map(
        (q) =>
          `Q${q.id}: ${q.question}\nAnswer: ${finalAnswers[q.id] || "No answer"}`
      )
      .join("\n\n");

    let verdict = "???";
    let explanation = "The spirits of bohemia couldn't be reached.";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are judging a fun "Are You Bohemian?" personality quiz. The person's name is ${name || "friend"}.

Here are their answers:

${formatted}

Based on these answers, decide: Is ${name || "this person"} Bohemian? Give a clear YES or NO verdict first, then a fun, personalized 3-4 sentence explanation addressed directly to ${name || "them"}. Be witty, warm, and specific — reference their actual answers. Format your response as:

VERDICT: YES or NO

EXPLANATION: (your explanation here addressing ${name || "them"} by name)`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "";
      const verdictMatch = text.match(/VERDICT:\s*(YES|NO)/i);
      const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*)/i);

      verdict = verdictMatch ? verdictMatch[1].toUpperCase() : "YES";
      explanation = explanationMatch
        ? explanationMatch[1].trim()
        : text.trim();
    } catch (err) {
      console.error("Claude API error:", err);
    }

    // ── Save to backend ──
    try {
      const payload = {
        name: name,
        verdict: verdict,
        explanation: explanation,
        answers: questions.map((q) => ({
          questionNumber: q.id,
          questionText: q.question,
          answerText: finalAnswers[q.id] || "No answer",
          questionType: q.type,
        })),
      };

      await fetch(`${API_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Backend save error:", err);
      // Quiz still works even if backend is down
    }

    setResult({ verdict, explanation });
    setLoading(false);
  };

  const restart = () => {
    setName("");
    setStarted(false);
    setCurrent(0);
    setAnswers({});
    setTextInput("");
    setResult(null);
    setLoading(false);
  };

  const progress = ((current + (result ? 1 : 0)) / questions.length) * 100;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -2%); }
          30% { transform: translate(3%, -1%); }
          50% { transform: translate(-1%, 3%); }
          70% { transform: translate(2%, 1%); }
          90% { transform: translate(-3%, 2%); }
        }
        .grain::before {
          content: "";
          position: fixed;
          top: -50%; left: -50%; right: -50%; bottom: -50%;
          width: 200%; height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          animation: grain 4s steps(6) infinite;
          pointer-events: none; z-index: 1;
        }
        .option-btn:hover {
          transform: translateX(6px);
          background: rgba(139, 90, 43, 0.12);
          border-left-color: #8B5A2B;
        }
        .option-btn:active { transform: translateX(3px) scale(0.99); }
        .fade-active { opacity: 1; transition: opacity 0.35s ease; }
        .fade-out { opacity: 0; transition: opacity 0.35s ease; }
      `}</style>

      <div
        className="grain"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #F5EDE3 0%, #E8D5C0 35%, #DFC8AD 65%, #D4B896 100%)",
          fontFamily: `'${bodyFont}', Georgia, serif`,
          color: "#3B2F2F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "fixed", top: "5%", right: "8%", fontSize: "64px", opacity: 0.08, animation: "float 7s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }}>&#9784;</div>
        <div style={{ position: "fixed", bottom: "10%", left: "6%", fontSize: "48px", opacity: 0.07, animation: "float 9s ease-in-out infinite 1s", pointerEvents: "none", zIndex: 0 }}>&#10047;</div>
        <div style={{ position: "fixed", top: "40%", left: "3%", fontSize: "36px", opacity: 0.06, animation: "float 11s ease-in-out infinite 2s", pointerEvents: "none", zIndex: 0 }}>&#9733;</div>

        <div style={{
          maxWidth: 580, width: "100%",
          background: "rgba(255,252,247,0.75)",
          backdropFilter: "blur(12px)", borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 8px 40px rgba(80,50,20,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
          border: "1px solid rgba(180,150,110,0.25)",
          position: "relative", zIndex: 2,
        }}>
          {/* INTRO */}
          {!started && !result && !loading && (
            <div style={{ textAlign: "center", animation: "fadeSlide 0.6s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 8, animation: "float 5s ease-in-out infinite" }}>&#127803;</div>
              <h1 style={{
                fontFamily: `'${bohemianFont}', serif`, fontSize: 38,
                fontWeight: 900, fontStyle: "italic", lineHeight: 1.15,
                margin: "0 0 8px", letterSpacing: "-0.5px", color: "#4A3728",
              }}>Are You Bohemian?</h1>
              <p style={{ fontSize: 15, color: "#7A6A5A", margin: "0 0 32px", fontStyle: "italic", lineHeight: 1.6 }}>
                Eight questions to discover if your soul wanders free.
              </p>
              <div style={{ marginBottom: 28, textAlign: "left" }}>
                <label style={{
                  display: "block", fontSize: 13, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "1.5px",
                  color: "#8B7A6A", marginBottom: 10,
                }}>What shall we call you?</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name…"
                  style={{
                    width: "100%", padding: "14px 18px", fontSize: 17,
                    fontFamily: `'${bohemianFont}', serif`, fontStyle: "italic",
                    border: "none", borderBottom: "2px solid #C4A882",
                    background: "transparent", color: "#3B2F2F", outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.3s",
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = "#8B5A2B")}
                  onBlur={(e) => (e.target.style.borderBottomColor = "#C4A882")}
                />
              </div>
              <button onClick={() => name.trim() && setStarted(true)} disabled={!name.trim()}
                style={{
                  padding: "16px 48px", fontSize: 16,
                  fontFamily: `'${bohemianFont}', serif`, fontWeight: 700,
                  fontStyle: "italic",
                  background: name.trim() ? "linear-gradient(135deg, #8B5A2B, #6B3A1B)" : "#C4B8A8",
                  color: "#FFF8F0", border: "none", borderRadius: 50,
                  cursor: name.trim() ? "pointer" : "default",
                  letterSpacing: "0.5px", transition: "all 0.3s",
                  boxShadow: name.trim() ? "0 4px 20px rgba(107,58,27,0.3)" : "none",
                }}>Begin the Journey</button>
            </div>
          )}

          {/* QUESTIONS */}
          {started && !result && !loading && (
            <div className={fadeIn ? "fade-active" : "fade-out"}>
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 12, color: "#8B7A6A", marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700,
                }}>
                  <span>Question {current + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(180,150,110,0.2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "linear-gradient(90deg, #8B5A2B, #C49A6C)",
                    borderRadius: 4, transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
              <h2 style={{
                fontFamily: `'${bohemianFont}', serif`, fontSize: 24, fontWeight: 700,
                fontStyle: "italic", lineHeight: 1.35, margin: "0 0 24px", color: "#4A3728",
              }}>{questions[current].question}</h2>
              {questions[current].type === "multiple" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {questions[current].options.map((opt, i) => (
                    <button key={i} className="option-btn" onClick={() => handleAnswer(opt)}
                      style={{
                        textAlign: "left", padding: "16px 20px", fontSize: 15,
                        fontFamily: `'${bodyFont}', serif`, lineHeight: 1.5,
                        background: "rgba(139, 90, 43, 0.04)", border: "none",
                        borderLeft: "3px solid rgba(139, 90, 43, 0.2)",
                        borderRadius: "0 10px 10px 0", color: "#4A3728",
                        cursor: "pointer", transition: "all 0.25s ease",
                      }}>{opt}</button>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)}
                    placeholder={questions[current].placeholder} rows={3}
                    style={{
                      width: "100%", padding: "16px 18px", fontSize: 16,
                      fontFamily: `'${bodyFont}', serif`, fontStyle: "italic",
                      border: "2px solid rgba(180,150,110,0.3)", borderRadius: 12,
                      background: "rgba(255,252,247,0.5)", color: "#3B2F2F",
                      outline: "none", resize: "vertical", boxSizing: "border-box",
                      lineHeight: 1.6, transition: "border-color 0.3s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#8B5A2B")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(180,150,110,0.3)")}
                  />
                  <button onClick={() => textInput.trim() && handleAnswer(textInput.trim())}
                    disabled={!textInput.trim()}
                    style={{
                      marginTop: 16, padding: "14px 40px", fontSize: 15,
                      fontFamily: `'${bohemianFont}', serif`, fontWeight: 700,
                      fontStyle: "italic",
                      background: textInput.trim() ? "linear-gradient(135deg, #8B5A2B, #6B3A1B)" : "#C4B8A8",
                      color: "#FFF8F0", border: "none", borderRadius: 50,
                      cursor: textInput.trim() ? "pointer" : "default",
                      transition: "all 0.3s",
                    }}>Continue →</button>
                </div>
              )}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeSlide 0.5s ease" }}>
              <div style={{ fontSize: 48, marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }}>&#128302;</div>
              <p style={{ fontFamily: `'${bohemianFont}', serif`, fontSize: 22, fontStyle: "italic", color: "#6B4A2E", margin: 0 }}>
                Reading your aura, {name}…
              </p>
              <p style={{ fontSize: 14, color: "#8B7A6A", marginTop: 8 }}>The universe is deliberating.</p>
            </div>
          )}

          {/* RESULT */}
          {result && (
            <div style={{ textAlign: "center", animation: "fadeSlide 0.7s ease" }}>
              <div style={{ fontSize: 60, marginBottom: 12, animation: "float 4s ease-in-out infinite" }}>
                {result.verdict === "YES" ? "🌻" : "🏢"}
              </div>
              <div style={{
                display: "inline-block", padding: "6px 28px", borderRadius: 50,
                fontSize: 13, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "2.5px", marginBottom: 16,
                background: result.verdict === "YES"
                  ? "linear-gradient(135deg, #8B5A2B, #6B3A1B)"
                  : "linear-gradient(135deg, #6B6B6B, #4A4A4A)",
                color: "#FFF8F0",
              }}>The Verdict</div>
              <h2 style={{
                fontFamily: `'${bohemianFont}', serif`, fontSize: 42,
                fontWeight: 900, fontStyle: "italic", margin: "8px 0 4px",
                color: result.verdict === "YES" ? "#5A3A1A" : "#4A4A4A",
              }}>{result.verdict === "YES" ? `Yes, ${name}!` : `Not quite, ${name}.`}</h2>
              <p style={{
                fontFamily: `'${bohemianFont}', serif`, fontSize: 18,
                fontStyle: "italic", color: "#7A6A5A", margin: "0 0 24px",
              }}>{result.verdict === "YES" ? "You are Bohemian at heart." : "Your spirit walks a different path."}</p>
              <div style={{
                background: "rgba(139, 90, 43, 0.06)", borderRadius: 14,
                padding: "24px 28px", borderLeft: "4px solid #8B5A2B",
                textAlign: "left", lineHeight: 1.75, fontSize: 15,
                color: "#4A3728", marginBottom: 28,
              }}>{result.explanation}</div>
              <button onClick={restart}
                style={{
                  padding: "14px 40px", fontSize: 15,
                  fontFamily: `'${bohemianFont}', serif`, fontWeight: 700,
                  fontStyle: "italic", background: "transparent",
                  color: "#8B5A2B", border: "2px solid #8B5A2B",
                  borderRadius: 50, cursor: "pointer",
                  transition: "all 0.3s", letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#8B5A2B"; e.target.style.color = "#FFF8F0"; }}
                onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#8B5A2B"; }}
              >Take It Again</button>
            </div>
          )}
        </div>
        <p style={{
          marginTop: 20, fontSize: 12, color: "rgba(100,80,60,0.4)",
          fontStyle: "italic", zIndex: 2, position: "relative",
        }}>Judged with care by Claude ✦ Anthropic</p>
      </div>
    </>
  );
}
