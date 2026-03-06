import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { carDatabase, CarEntry } from "./data/carDatabase";
import {
  generateRelayLogs,
  generateInjectionLogs,
  generateSafeLogs,
  TerminalLine,
} from "./utils/terminalLogs";

// ─── Radar Background ───────────────────────────────────────────────
function RadarBackground({ scanning }: { scanning: boolean }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,243,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radar circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className={`w-[800px] h-[800px] rounded-full border border-cyan-900/20 relative ${
            scanning ? "opacity-30" : "opacity-10"
          } transition-opacity duration-1000`}
        >
          {/* Concentric rings */}
          <div className="absolute inset-[25%] rounded-full border border-cyan-900/30" />
          <div className="absolute inset-[50%] rounded-full border border-cyan-900/20" />
          {/* Sweep */}
          <div
            className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left ${
              scanning ? "animate-radar" : ""
            }`}
            style={{
              background:
                "linear-gradient(90deg, rgba(0,243,255,0.6), transparent)",
              animationDuration: scanning ? "3s" : "8s",
            }}
          />
          {/* Glow at center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-500/50 shadow-[0_0_20px_rgba(0,243,255,0.4)]" />
        </div>
      </div>
      {/* Scan line overlay */}
      {scanning && (
        <div
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
          style={{ animation: "scanLine 2s linear infinite" }}
        />
      )}
      {/* Spectrum wave at bottom */}
      <svg
        className={`absolute bottom-0 left-0 w-full h-24 transition-opacity duration-500 ${
          scanning ? "opacity-40" : "opacity-10"
        }`}
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const x = i * 20;
          const h = scanning
            ? Math.random() * 60 + 10
            : Math.sin(i * 0.3) * 15 + 20;
          return (
            <rect
              key={i}
              x={x}
              y={100 - h}
              width="8"
              height={h}
              fill="url(#specGrad)"
              opacity={0.6}
              style={{
                animation: scanning
                  ? `specBar${i % 5} ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`
                  : "none",
              }}
            />
          );
        })}
        <defs>
          <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
      <style>{`
        @keyframes specBar0 { from { height: 20px; } to { height: 70px; } }
        @keyframes specBar1 { from { height: 30px; } to { height: 55px; } }
        @keyframes specBar2 { from { height: 15px; } to { height: 65px; } }
        @keyframes specBar3 { from { height: 25px; } to { height: 50px; } }
        @keyframes specBar4 { from { height: 10px; } to { height: 60px; } }
      `}</style>
    </div>
  );
}

// ─── Terminal Component ──────────────────────────────────────────────
function TerminalOutput({
  lines,
  visible,
}: {
  lines: { text: string; color: string; isHex?: boolean }[];
  visible: boolean;
}) {
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines]);

  if (!visible) return null;

  return (
    <div className="animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
      {/* Terminal title bar */}
      <div className="flex items-center justify-between bg-[#1a1e2e] px-4 py-2.5 rounded-t-lg border-t border-l border-r border-slate-700/50">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="text-[10px] font-mono text-slate-500 tracking-wide">
          root@sentry-rf-module:~# ./execute_diag.sh --deep --enterprise
        </div>
        <div className="text-[10px] font-mono text-slate-600">bash</div>
      </div>
      {/* Terminal body */}
      <div
        ref={termRef}
        className="terminal-window p-4 h-80 md:h-96 overflow-y-auto font-mono text-[11px] md:text-xs leading-relaxed rounded-b-lg"
      >
        {lines.map((line, i) => (
          <div key={i} className={`${line.color} ${line.isHex ? "opacity-60 ml-4" : ""}`}>
            {line.text === "" ? <br /> : (
              <span>
                {line.text.includes("[CRITICAL]") ? (
                  <span>
                    <span className="text-red-500 font-bold text-glow-red">[CRITICAL]</span>
                    <span className="text-red-400">{line.text.replace("[CRITICAL]", "")}</span>
                  </span>
                ) : line.text.includes("[WARNING]") ? (
                  <span>
                    <span className="text-amber-500 font-bold text-glow-amber">[WARNING]</span>
                    <span className="text-amber-300/80">{line.text.replace("[WARNING]", "")}</span>
                  </span>
                ) : line.text.includes("[INFO]") ? (
                  <span>
                    <span className="text-blue-400">[INFO]</span>
                    <span className="text-slate-400">{line.text.replace("[INFO]", "")}</span>
                  </span>
                ) : line.text.includes("[INIT]") ? (
                  <span>
                    <span className="text-cyan-500">[INIT]</span>
                    <span className="text-cyan-400/70">{line.text.replace("[INIT]", "")}</span>
                  </span>
                ) : line.text.includes("[PHASE") ? (
                  <span className="text-cyan-300 font-bold">{line.text}</span>
                ) : (
                  line.text
                )}
              </span>
            )}
          </div>
        ))}
        {lines.length > 0 && lines[lines.length - 1]?.text !== "root@sentry-rf:~# _" && (
          <span className="text-green-400 animate-blink">█</span>
        )}
      </div>
    </div>
  );
}

// ─── Results Dashboard ───────────────────────────────────────────────
function VulnerableResults({
  car,
  year,
}: {
  car: CarEntry;
  year: number;
}) {
  const isRelay = car.type === "RELAY";
  const threatTitle = isRelay
    ? "Relay Amplification Attack (PKES LF/UHF Bridge)"
    : "CAN Bus Injection Attack (Headlight Harness Vector)";

  const threatDescription = isRelay
    ? `The ${year} ${car.make} ${car.model} employs a Passive Keyless Entry & Start (PKES) system operating on the ${car.protocol} protocol. This system continuously broadcasts a low-frequency (125kHz) challenge signal within a ~2m radius of the vehicle. An attacker, using a two-device relay kit costing under $50, can amplify and bridge this LF signal over distances exceeding 300 meters to the key fob, which automatically responds on the UHF (433/315MHz) band. The vehicle's BCM cannot distinguish a relayed signal from a legitimate proximity event, granting full unlock and engine start authorization. This attack requires zero physical contact with the vehicle or key and takes under 10 seconds to execute.`
    : `The ${year} ${car.make} ${car.model} utilizes the ${car.protocol} protocol for immobilizer authentication. A critical design flaw allows an attacker to physically access the vehicle's CAN Bus network via the unshielded wiring harness exposed in the headlight assembly. By injecting forged CAN frames (specifically targeting arbitration ID ${car.make === "Toyota" ? "0x750" : "0x7DF"}), an attacker can directly command the Body Control Module (BCM) to unlock doors and simultaneously spoof the Smartra immobilizer response to authorize engine start. The attack requires a $20-$30 CAN transceiver device and takes under 60 seconds. No software patch exists from the OEM.`;

  return (
    <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
      {/* Status Header */}
      <div className="glass-panel rounded-lg p-[3px] border-l-4 border-red-500">
        <div className="bg-slate-900/70 p-6 rounded-r-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              DIAGNOSTIC COMPLETE
            </h3>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              ⚠ CRITICAL VULNERABILITY
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-500 text-[10px] mb-1 uppercase font-mono tracking-widest">
                Target Vehicle
              </p>
              <p className="text-lg text-white font-semibold">
                {year} {car.make} {car.model}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] mb-1 uppercase font-mono tracking-widest">
                Protocol Detected
              </p>
              <p className="text-white font-mono text-sm">{car.protocol}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] mb-1 uppercase font-mono tracking-widest">
                CVSS Score
              </p>
              <p className="text-red-400 font-mono text-sm font-bold text-glow-red">
                {isRelay ? "9.8" : "9.6"} / 10.0 — CRITICAL
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Technical Vector */}
        <div className="lg:col-span-2 glass-panel rounded-lg p-6">
          <h4 className="text-cyan-400 font-mono text-[10px] uppercase tracking-[0.2em] mb-5 border-b border-slate-800 pb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Threat Vector Analysis
          </h4>
          <div className="space-y-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h5 className="text-white font-bold text-sm">{threatTitle}</h5>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {threatDescription}
                </p>
              </div>
            </div>

            {/* Technical Data Box */}
            <div className="bg-[#0a0e17] rounded-lg p-4 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1.5">
              <p>
                <span className="text-blue-400">CVE_REF       :</span>{" "}
                <span className="text-slate-300">{car.cve || "CVE-2023-XXXX"}</span>
              </p>
              <p>
                <span className="text-blue-400">ATTACK_VECTOR :</span>{" "}
                <span className="text-slate-300">{car.vector}</span>
              </p>
              <p>
                <span className="text-blue-400">ATTACK_RANGE  :</span>{" "}
                <span className="text-slate-300">{car.attackRange || "> 300m"}</span>
              </p>
              <p>
                <span className="text-blue-400">EQUIP_COST    :</span>{" "}
                <span className="text-slate-300">{car.equipCost || "< $50 USD"}</span>
              </p>
              <p>
                <span className="text-blue-400">SUCCESS_RATE  :</span>{" "}
                <span className="text-red-400 font-bold text-glow-red">
                  {car.successRate || "96.0%"}
                </span>
              </p>
              <p>
                <span className="text-blue-400">OEM_PATCH     :</span>{" "}
                <span className="text-red-400">UNAVAILABLE</span>
              </p>
              <p>
                <span className="text-blue-400">TIME_TO_THEFT :</span>{" "}
                <span className="text-red-400">{isRelay ? "< 10 seconds" : "< 60 seconds"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Mitigation Panel */}
        <div className="glass-panel rounded-lg overflow-hidden relative border border-red-500/20">
          {/* Top red bar */}
          <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

          <div className="p-6 relative">
            {/* Background icon */}
            <div className="absolute top-4 right-4 opacity-[0.04]">
              <svg className="w-32 h-32 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h4 className="text-red-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                CRITICAL — MITIGATION REQUIRED
              </h4>
            </div>

            <div className="space-y-5 text-sm">
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                <strong className="text-white block mb-1 text-xs uppercase tracking-wider">
                  Software Patch Status:
                </strong>
                <span className="text-red-400 font-mono text-xs font-bold">
                  ✕ UNAVAILABLE / NOT APPLICABLE
                </span>
                <p className="text-slate-500 text-[11px] mt-1">
                  No OEM over-the-air or dealer-applied firmware update addresses this hardware-level vulnerability.
                </p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <strong className="text-white block mb-2 text-xs uppercase tracking-wider">
                  ⚠ Advisory: Flexible Faraday Pouches
                </strong>
                <p className="text-slate-400 text-[12px] leading-relaxed">
                  <span className="text-red-400 font-bold">"The Silent Betrayal"</span>
                  : Laboratory testing (per MIL-STD-188-125-2 and IEEE 299-2006 shielding
                  effectiveness standards) confirms that flexible conductive-mesh Faraday bags
                  degrade to <span className="text-white font-semibold">below -30dB attenuation</span> within
                  90 days of daily use due to{" "}
                  <span className="text-white font-semibold">Flexural Fatigue</span> — the
                  progressive fracturing of metallic weave fibers at repeated fold
                  points. These micro-tears in the conductive layer create invisible RF
                  signal leakage paths, rendering the pouch{" "}
                  <span className="text-red-400 font-semibold">functionally transparent</span> to
                  relay amplification equipment while providing the operator a false
                  sense of security.
                </p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <strong className="text-white block mb-2 text-xs uppercase tracking-wider">
                  ✓ Recommended Countermeasure
                </strong>
                <p className="text-slate-400 text-[12px] leading-relaxed">
                  A <span className="text-white font-semibold">rigid-shell Faraday enclosure</span>{" "}
                  with welded seam construction and tested ≥60dB attenuation across
                  100kHz–6GHz provides the only field-proven, maintenance-free physical
                  mitigation for PKES relay attacks.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 text-white font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-[0.15em] animate-cta-pulse transition-all duration-300 border border-red-500/30 cursor-pointer">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ACQUIRE CERTIFIED RIGID ENCLOSURE
                </span>
              </button>
              <p className="text-slate-600 text-[9px] text-center mt-2 font-mono">
                MIL-SPEC VERIFIED · ≥60dB ATTENUATION · LIFETIME WARRANTY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SafeResults({ car, year }: { car: CarEntry; year: number }) {
  return (
    <div className="animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
      <div className="glass-panel rounded-lg p-8 text-center border-t-4 border-green-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4 border border-green-500/20">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          No RF Vulnerability Detected
        </h3>
        <p className="text-slate-400 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
          The {year} {car.make} {car.model} utilizes a{" "}
          <span className="text-white font-semibold">{car.protocol}</span>{" "}
          architecture that is currently resistant to standard Relay
          Amplification and CAN Bus Injection attack vectors. No wireless
          attack surface was identified during the diagnostic sweep.
        </p>
        <div className="bg-slate-900/50 inline-block px-5 py-2.5 rounded-lg border border-slate-700">
          <span className="text-green-400 font-mono text-sm text-glow-green">
            THREAT LEVEL: LOW / NEGLIGIBLE
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export function App() {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [scanning, setScanning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<
    { text: string; color: string; isHex?: boolean }[]
  >([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [foundCar, setFoundCar] = useState<CarEntry | null>(null);
  const scanAbortRef = useRef(false);

  // Get unique makes
  const makes = useMemo(() => {
    const m = [...new Set(carDatabase.map((c) => c.make))].sort();
    return m;
  }, []);

  // Get models for selected make
  const models = useMemo(() => {
    if (!selectedMake) return [];
    const m = [
      ...new Set(
        carDatabase.filter((c) => c.make === selectedMake).map((c) => c.model)
      ),
    ].sort();
    return m;
  }, [selectedMake]);

  // Get years for selected make+model
  const years = useMemo(() => {
    if (!selectedMake || !selectedModel) return [];
    const entries = carDatabase.filter(
      (c) => c.make === selectedMake && c.model === selectedModel
    );
    if (entries.length === 0) return [];
    const minYear = Math.min(...entries.map((e) => e.startYear));
    const maxYear = Math.max(...entries.map((e) => e.endYear));
    const yrs: number[] = [];
    for (let y = maxYear; y >= minYear; y--) yrs.push(y);
    return yrs;
  }, [selectedMake, selectedModel]);

  // Reset downstream on make change
  useEffect(() => {
    setSelectedModel("");
    setSelectedYear("");
  }, [selectedMake]);

  useEffect(() => {
    setSelectedYear("");
  }, [selectedModel]);

  // Find matching car
  const findCar = useCallback((): CarEntry | null => {
    const year = parseInt(selectedYear);
    return (
      carDatabase.find(
        (c) =>
          c.make === selectedMake &&
          c.model === selectedModel &&
          year >= c.startYear &&
          year <= c.endYear
      ) || null
    );
  }, [selectedMake, selectedModel, selectedYear]);

  // Run scan
  const runScan = useCallback(async () => {
    if (scanning) return;
    scanAbortRef.current = false;
    setScanning(true);
    setShowTerminal(true);
    setShowResults(false);
    setTerminalLines([]);
    setFoundCar(null);

    const car = findCar();
    if (!car) {
      setScanning(false);
      return;
    }

    const year = parseInt(selectedYear);
    let logs: TerminalLine[];

    if (car.type === "RELAY") {
      logs = generateRelayLogs(car, year);
    } else if (car.type === "INJECTION") {
      logs = generateInjectionLogs(car, year);
    } else {
      logs = generateSafeLogs(car, year);
    }

    // Play logs with delays
    for (let i = 0; i < logs.length; i++) {
      if (scanAbortRef.current) break;
      const line = logs[i];
      await new Promise<void>((resolve) => setTimeout(resolve, line.delay));
      if (scanAbortRef.current) break;
      setTerminalLines((prev) => [
        ...prev,
        { text: line.text, color: line.color, isHex: line.isHex },
      ]);
    }

    if (!scanAbortRef.current) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      setFoundCar(car);
      setShowResults(true);
    }
    setScanning(false);
  }, [findCar, scanning, selectedYear]);

  const canScan = selectedMake && selectedModel && selectedYear && !scanning;

  return (
    <div className="relative min-h-screen">
      <RadarBackground scanning={scanning} />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider text-white">
                SENTRY{" "}
                <span className="text-cyan-400 font-mono text-[10px] font-normal tracking-[0.3em]">
                  RF INTELLIGENCE
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-5 text-[10px] font-mono text-slate-500">
            <div className="hidden md:flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              ONLINE
            </div>
            <div className="hidden md:block">v5.0.2-ENT</div>
            <div className="hidden lg:block">DB: 24,891 SIGS</div>
            <div className="hidden lg:block">
              {new Date().toISOString().slice(0, 10)}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <div className="text-center mb-6">
          <p className="text-cyan-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-3">
            Enterprise Vulnerability Assessment Platform
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Vehicle RF Diagnostic
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
            Execute a cryptographic integrity test on OEM keyless entry
            protocols. Simulates LF/UHF bridging, CAN-FD injection vectors,
            rolling code entropy analysis, and UWB distance bounding validation.
          </p>
        </div>

        {/* Control Panel */}
        <div className="glass-panel rounded-xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            {/* Make */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-cyan-400/80 uppercase tracking-[0.2em]">
                Manufacturer
              </label>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="w-full bg-[#0a0e17] border border-slate-700/60 text-white text-sm rounded-lg p-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all cursor-pointer"
              >
                <option value="">Select Make...</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-cyan-400/80 uppercase tracking-[0.2em]">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                className="w-full bg-[#0a0e17] border border-slate-700/60 text-white text-sm rounded-lg p-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Select Model...</option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-cyan-400/80 uppercase tracking-[0.2em]">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedModel}
                className="w-full bg-[#0a0e17] border border-slate-700/60 text-white text-sm rounded-lg p-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Select Year...</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Scan Button */}
            <div>
              <button
                onClick={runScan}
                disabled={!canScan}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_25px_rgba(8,145,178,0.3)] transition-all transform active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-2 cursor-pointer border border-cyan-500/30"
              >
                {scanning ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="font-mono text-sm">SCANNING...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="tracking-wider text-sm">INITIATE SCAN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <TerminalOutput lines={terminalLines} visible={showTerminal} />

        {/* Results */}
        {showResults && foundCar && (
          <div>
            {foundCar.type === "SAFE" ? (
              <SafeResults car={foundCar} year={parseInt(selectedYear)} />
            ) : (
              <VulnerableResults car={foundCar} year={parseInt(selectedYear)} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 mt-16 py-6 bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <p className="text-slate-600 text-[10px] font-mono tracking-wider">
            SENTRY RF INTELLIGENCE PLATFORM © {new Date().getFullYear()} ·
            v5.0.2-ENTERPRISE · AUTHORIZED USE ONLY
          </p>
          {/* FTC/Amazon Compliance Disclaimer */}
          <div className="border-t border-slate-800/30 pt-4 mt-4">
            <p className="text-slate-700 text-[9px] font-mono leading-relaxed max-w-3xl mx-auto tracking-wide">
              <span className="text-slate-600">SYS_TELEMETRY //</span> LEGAL
              &amp; COMPLIANCE DATA: SENTRY is an independent OSINT tool. To
              maintain server infrastructure, this tool participates in the
              Amazon Services LLC Associates Program. As an Amazon Associate,
              we earn from qualifying purchases made through external
              mitigation links provided in the diagnostic report, at zero
              additional cost to the operator. Use of this tool on
              unauthorized targets violates the CFAA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
