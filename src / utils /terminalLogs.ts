import { CarEntry } from "../data/carDatabase";

export interface TerminalLine {
  text: string;
  color: string; // tailwind text color class
  delay: number; // ms to wait before showing this line
  isHex?: boolean;
}

function randomHex(bytes: number): string {
  const chars = "0123456789ABCDEF";
  let result = "";
  for (let i = 0; i < bytes; i++) {
    if (i > 0 && i % 16 === 0) result += "\n";
    else if (i > 0) result += " ";
    result += chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function randomIP(): string {
  return `192.168.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 254) + 1}`;
}

export function generateRelayLogs(car: CarEntry, year: number): TerminalLine[] {
  const make = car.make;
  const model = car.model;
  const hexDump1 = randomHex(64);
  const hexDump2 = randomHex(48);
  const hexDump3 = randomHex(32);
  const entropy = (Math.random() * 0.3 + 0.12).toFixed(4);
  const rssi = -(Math.floor(Math.random() * 30) + 40);
  const freq1 = "125.000";
  const freq2 = "433.920";
  const freq3 = "315.000";

  return [
    { text: `[INIT] SENTRY RF Intelligence Platform v5.0.2-enterprise`, color: "text-cyan-400", delay: 100 },
    { text: `[INIT] Loading vulnerability signature database... 24,891 entries`, color: "text-slate-400", delay: 200 },
    { text: `[INIT] Calibrating SDR frontend (HackRF One r9)... OK`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Target: ${year} ${make} ${model}`, color: "text-blue-400", delay: 200 },
    { text: `[INFO] Protocol fingerprint: ${car.protocol}`, color: "text-blue-400", delay: 150 },
    { text: `[INFO] Attack vector class: ${car.vector}`, color: "text-blue-400", delay: 100 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 1/4] RF SPECTRUM RECONNAISSANCE`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Initiating wideband sweep: 100kHz → 6GHz`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Polling 125kHz LF channel... signal detected`, color: "text-green-400", delay: 250 },
    { text: `[INFO] LF carrier locked @ ${freq1}kHz | RSSI: ${rssi}dBm | Modulation: ASK/OOK`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Polling ${freq2}MHz UHF channel... signal detected`, color: "text-green-400", delay: 200 },
    { text: `[INFO] UHF carrier locked @ ${freq2}MHz | RSSI: ${rssi + 8}dBm | FSK deviation: ±38kHz`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Secondary scan @ ${freq3}MHz (US band)... ${make === "Ford" || make === "Honda" ? "ACTIVE" : "dormant"}`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Bluetooth LE scan on 2.402-2.480GHz... ${make === "Tesla" ? "ACTIVE BEACON DETECTED" : "no active beacons"}`, color: make === "Tesla" ? "text-yellow-400" : "text-slate-400", delay: 200 },
    { text: `[WARNING] Passive keyless entry signal (PKES) broadcasting continuously`, color: "text-yellow-400", delay: 300 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 2/4] CRYPTOGRAPHIC ANALYSIS`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Intercepting challenge-response handshake...`, color: "text-slate-400", delay: 300 },
    { text: `[INFO] Captured LF wake-up frame (${Math.floor(Math.random() * 20) + 40} bytes):`, color: "text-slate-400", delay: 200 },
    { text: hexDump1, color: "text-emerald-600", delay: 100, isHex: true },
    { text: `[INFO] Analyzing transponder type... ${car.protocol.includes("Hitag") || make === "Nissan" ? "Hitag2 (NXP PCF7936)" : car.protocol.includes("BLE") ? "BLE 4.2 GATT" : "AES-128 (TOKAI RIKA)"}`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Analyzing Hitag2 entropy pool...`, color: "text-slate-400", delay: 250 },
    { text: `[WARNING] Shannon entropy: ${entropy} bits/symbol (threshold: 0.50)`, color: "text-yellow-400", delay: 200 },
    { text: `[WARNING] Cryptographic weakness detected: insufficient key randomization`, color: "text-yellow-400", delay: 200 },
    { text: `[INFO] Dumping EEPROM hex data from transponder emulation:`, color: "text-slate-400", delay: 200 },
    { text: hexDump2, color: "text-emerald-600", delay: 80, isHex: true },
    { text: `[INFO] Rolling code window analysis: delta=0x${Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0')} (within replay threshold)`, color: "text-slate-400", delay: 200 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 3/4] RELAY ATTACK SIMULATION`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Configuring LF/UHF relay bridge...`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Emitter node: ${randomIP()} (HackRF + LF loop antenna)`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Receiver node: ${randomIP()} (RTL-SDR + UHF Yagi)`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Bridge latency: ${(Math.random() * 2 + 0.5).toFixed(1)}ms (< 10ms threshold for PKES bypass)`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Bypassing UWB Distance Bounding protocol...`, color: "text-slate-400", delay: 300 },
    { text: `[WARNING] UWB time-of-flight check: ${car.make === "Land Rover" && car.model === "Defender" ? "PRESENT (attempting bypass)" : "NOT IMPLEMENTED by OEM"}`, color: "text-yellow-400", delay: 250 },
    { text: `[INFO] Simulating key proximity at vehicle BCM...`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Vehicle ECU response captured:`, color: "text-slate-400", delay: 150 },
    { text: hexDump3, color: "text-emerald-600", delay: 80, isHex: true },
    { text: `[CRITICAL] RELAY BRIDGE SUCCESSFUL — Vehicle unlocked at ${(Math.random() * 200 + 100).toFixed(0)}m range`, color: "text-red-500", delay: 400 },
    { text: `[CRITICAL] Engine start authorization: GRANTED (immobilizer bypassed)`, color: "text-red-500", delay: 300 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 4/4] THREAT ASSESSMENT`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[CRITICAL] ██ VULNERABILITY CONFIRMED ██`, color: "text-red-500", delay: 300 },
    { text: `[CRITICAL] Attack class: Relay Amplification (LF/UHF Bridge)`, color: "text-red-400", delay: 150 },
    { text: `[CRITICAL] CVE Reference: ${car.cve || "CVE-2023-XXXX"}`, color: "text-red-400", delay: 100 },
    { text: `[CRITICAL] Exploitability score: 9.8 / 10.0 (CVSS v3.1)`, color: "text-red-400", delay: 100 },
    { text: `[CRITICAL] OEM firmware patch: UNAVAILABLE`, color: "text-red-400", delay: 100 },
    { text: `[INFO] Diagnostic complete. Rendering mitigation report...`, color: "text-cyan-400", delay: 300 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `root@sentry-rf:~# _`, color: "text-green-400", delay: 100 },
  ];
}

export function generateInjectionLogs(car: CarEntry, year: number): TerminalLine[] {
  const make = car.make;
  const model = car.model;
  const hexDump1 = randomHex(48);
  const hexDump2 = randomHex(64);
  const hexDump3 = randomHex(32);
  const canId = make === "Toyota" ? "0x750" : "0x7DF";
  const arbId = `0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0')}`;

  return [
    { text: `[INIT] SENTRY RF Intelligence Platform v5.0.2-enterprise`, color: "text-cyan-400", delay: 100 },
    { text: `[INIT] Loading vulnerability signature database... 24,891 entries`, color: "text-slate-400", delay: 200 },
    { text: `[INIT] Initializing CAN Bus interface (SocketCAN / vcan0)... OK`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Target: ${year} ${make} ${model}`, color: "text-blue-400", delay: 200 },
    { text: `[INFO] Protocol fingerprint: ${car.protocol}`, color: "text-blue-400", delay: 150 },
    { text: `[INFO] Attack vector class: ${car.vector}`, color: "text-blue-400", delay: 100 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 1/4] CAN BUS TOPOLOGY MAPPING`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Scanning OBD-II port for active ECUs...`, color: "text-slate-400", delay: 250 },
    { text: `[INFO] ECU #1: BCM (Body Control Module) @ ${arbId}`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] ECU #2: EMS (Engine Management) @ 0x7E0`, color: "text-slate-400", delay: 100 },
    { text: `[INFO] ECU #3: SMARTRA (Immobilizer) @ 0x770`, color: "text-slate-400", delay: 100 },
    { text: `[INFO] ECU #4: GW (Gateway Module) @ 0x760`, color: "text-slate-400", delay: 100 },
    { text: `[WARNING] Gateway module does NOT enforce message authentication (no SecOC)`, color: "text-yellow-400", delay: 300 },
    { text: `[INFO] Bus speed: 500kbps (HS-CAN) | Protocol: ISO 15765-4`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Enumerating external CAN access points...`, color: "text-slate-400", delay: 200 },
    { text: `[CRITICAL] Unshielded CAN-H/CAN-L pair found on headlight harness connector`, color: "text-red-500", delay: 350 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 2/4] IMMOBILIZER BYPASS ANALYSIS`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Querying Smartra module for challenge...`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Smartra challenge frame received:`, color: "text-slate-400", delay: 150 },
    { text: hexDump1, color: "text-emerald-600", delay: 80, isHex: true },
    { text: `[INFO] Analyzing ${car.protocol} authentication handshake...`, color: "text-slate-400", delay: 250 },
    { text: `[WARNING] Smartra module accepts replayed challenge-response pairs`, color: "text-yellow-400", delay: 200 },
    { text: `[WARNING] No anti-replay nonce detected in immobilizer protocol`, color: "text-yellow-400", delay: 200 },
    { text: `[INFO] Generating Gameboy-compatible key emulation payload...`, color: "text-slate-400", delay: 250 },
    { text: `[INFO] Key emulation firmware: v3.2.1 (Smartra ${make === "Kia" || make === "Hyundai" ? "III/IV" : "generic"} compatible)`, color: "text-slate-400", delay: 150 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 3/4] CAN INJECTION SIMULATION`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Injecting unlock frame via headlight harness CAN tap...`, color: "text-slate-400", delay: 250 },
    { text: `[INFO] TX → ID:${canId} DLC:8 DATA:[${randomHex(8).replace(/\n/g, ' ')}]`, color: "text-slate-400", delay: 100 },
    { text: `[INFO] TX → ID:${canId} DLC:8 DATA:[${randomHex(8).replace(/\n/g, ' ')}]`, color: "text-slate-400", delay: 80 },
    { text: `[INFO] TX → ID:${canId} DLC:8 DATA:[${randomHex(8).replace(/\n/g, ' ')}]`, color: "text-slate-400", delay: 80 },
    { text: `[INFO] RX ← BCM ACK: Door unlock command accepted`, color: "text-green-400", delay: 200 },
    { text: `[INFO] Injecting engine start authorization frame...`, color: "text-slate-400", delay: 250 },
    { text: `[INFO] Forging Smartra response:`, color: "text-slate-400", delay: 150 },
    { text: hexDump2, color: "text-emerald-600", delay: 80, isHex: true },
    { text: `[CRITICAL] ENGINE START AUTHORIZATION: GRANTED`, color: "text-red-500", delay: 400 },
    { text: `[CRITICAL] CAN injection attack successful — full vehicle compromise`, color: "text-red-500", delay: 300 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 4/4] THREAT ASSESSMENT`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[CRITICAL] ██ VULNERABILITY CONFIRMED ██`, color: "text-red-500", delay: 300 },
    { text: `[CRITICAL] Attack class: CAN Bus Injection (Headlight Harness)`, color: "text-red-400", delay: 150 },
    { text: `[CRITICAL] CVE Reference: ${car.cve || "CVE-2023-XXXX"}`, color: "text-red-400", delay: 100 },
    { text: `[CRITICAL] Exploitability score: 9.6 / 10.0 (CVSS v3.1)`, color: "text-red-400", delay: 100 },
    { text: `[CRITICAL] OEM firmware patch: UNAVAILABLE`, color: "text-red-400", delay: 100 },
    { text: `[INFO] Rendering ECU dump:`, color: "text-slate-400", delay: 150 },
    { text: hexDump3, color: "text-emerald-600", delay: 80, isHex: true },
    { text: `[INFO] Diagnostic complete. Rendering mitigation report...`, color: "text-cyan-400", delay: 300 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `root@sentry-rf:~# _`, color: "text-green-400", delay: 100 },
  ];
}

export function generateSafeLogs(car: CarEntry, year: number): TerminalLine[] {
  return [
    { text: `[INIT] SENTRY RF Intelligence Platform v5.0.2-enterprise`, color: "text-cyan-400", delay: 100 },
    { text: `[INIT] Loading vulnerability signature database... 24,891 entries`, color: "text-slate-400", delay: 200 },
    { text: `[INIT] Calibrating SDR frontend (HackRF One r9)... OK`, color: "text-slate-400", delay: 150 },
    { text: `[INFO] Target: ${year} ${car.make} ${car.model}`, color: "text-blue-400", delay: 200 },
    { text: `[INFO] Protocol fingerprint: ${car.protocol}`, color: "text-blue-400", delay: 150 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 1/2] RF SPECTRUM RECONNAISSANCE`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Initiating wideband sweep: 100kHz → 6GHz`, color: "text-slate-400", delay: 250 },
    { text: `[INFO] Polling 125kHz LF channel... no signal`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Polling 433.920MHz UHF channel... no signal`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Polling 315.000MHz UHF channel... no signal`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] Bluetooth LE scan... no active beacons`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] No PKES (Passive Keyless Entry) signal detected`, color: "text-green-400", delay: 250 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[PHASE 2/2] VULNERABILITY ASSESSMENT`, color: "text-cyan-300", delay: 300 },
    { text: `───────────────────────────────────────────────────────`, color: "text-slate-700", delay: 50 },
    { text: `[INFO] Vehicle uses ${car.protocol}`, color: "text-slate-400", delay: 200 },
    { text: `[INFO] No wireless attack surface detected`, color: "text-green-400", delay: 200 },
    { text: `[INFO] CAN Bus injection: NOT APPLICABLE (no exposed harness)`, color: "text-green-400", delay: 200 },
    { text: `[INFO] Relay attack: NOT APPLICABLE (no PKES system)`, color: "text-green-400", delay: 200 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `[INFO] ██ NO VULNERABILITY DETECTED ██`, color: "text-green-400", delay: 300 },
    { text: `[INFO] Threat level: LOW / NEGLIGIBLE`, color: "text-green-400", delay: 150 },
    { text: `[INFO] Diagnostic complete.`, color: "text-cyan-400", delay: 200 },
    { text: ``, color: "text-slate-500", delay: 50 },
    { text: `root@sentry-rf:~# _`, color: "text-green-400", delay: 100 },
  ];
}
