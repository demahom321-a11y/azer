import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  ShieldCheck, Cpu, Loader2, Radio, Wifi, Lock, AlertTriangle, Shield,
  ChevronDown, Activity, Fingerprint, Server, KeyRound, RotateCcw,
  CircuitBoard, Waypoints, Gauge, BadgeCheck, Crosshair,
  Signal, Network, ShieldAlert, CheckCircle2, XCircle, Eye, Layers,
  Binary, Antenna, Globe, Timer, Target, ShieldOff, Cable,
  Car, ScanLine, BarChart3, FileText, Radar, Bug, Blocks,
  MapPin, Clock, ArrowRight, Hash, ExternalLink, ShoppingCart, Box, Zap, Star
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface VehicleSpec {
  transponderCore: string;
  keySystem: string;
  lfWakeUp: string;
  uhfCarrier: string;
  uwbStatus: string;
  cryptoStandard: string;
  canTopology: string;
  primaryVulnerability: string;
  physicalAccessPoint: string;
  requiredMitigation: string;
  baudRate: string;
  telematicsProtocol: string;
}
interface ModelData { years: string[]; spec: VehicleSpec }
interface MakeData { models: Record<string, ModelData> }

type ThreatLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "SECURE";
type TabId = "status" | "signal" | "network" | "threats" | "report";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function y(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) => String(end - i));
}
function s(o: Partial<VehicleSpec>): VehicleSpec {
  return {
    transponderCore: o.transponderCore ?? "NXP Hitag-Pro",
    keySystem: o.keySystem ?? "Smart Key Passive Entry",
    lfWakeUp: o.lfWakeUp ?? "125 kHz — Passive polling active",
    uhfCarrier: o.uhfCarrier ?? "433.92 MHz (EU) — Standard carrier",
    uwbStatus: o.uwbStatus ?? "Absent — Relay vulnerable",
    cryptoStandard: o.cryptoStandard ?? "AES-128 Symmetric Encryption",
    canTopology: o.canTopology ?? "CAN-FD backbone network",
    primaryVulnerability: o.primaryVulnerability ?? "Relay Attack — Signal extension",
    physicalAccessPoint: o.physicalAccessPoint ?? "Key fob proximity — RF leakage",
    requiredMitigation: o.requiredMitigation ?? "Rigid Faraday Attenuation (>90 dB)",
    baudRate: o.baudRate ?? "500 kbps CAN — ISO 11898",
    telematicsProtocol: o.telematicsProtocol ?? "4G LTE Telematics",
  };
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORM PRESETS
   ═══════════════════════════════════════════════════════════════ */
const TNGA: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-Pro / DST80", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Constant carrier", cryptoStandard:"AES-128 Symmetric Encryption", baudRate:"4.8 kbps — Manchester Encoding" };
const JLR: Partial<VehicleSpec> = { transponderCore:"NXP NCF29A1 / Hitag-AES", lfWakeUp:"125 kHz — Multi-antenna polling", uhfCarrier:"433.92 MHz (EU) — Encrypted burst", cryptoStandard:"AES-128 with rotating seed challenge", baudRate:"2 Mbps CAN-FD — Flexible data rate" };
const BMW_P: Partial<VehicleSpec> = { transponderCore:"NXP S32K-based Secure Element", lfWakeUp:"125 kHz — Comfort Access polling", uhfCarrier:"433.92 MHz (EU) / 315 MHz (US)", cryptoStandard:"AES-128 + BMW proprietary immobilizer seed", baudRate:"2 Mbps CAN-FD — ISO 11898-1:2015" };
const MB_P: Partial<VehicleSpec> = { transponderCore:"NXP NCF29A1 with EIS Module", lfWakeUp:"125 kHz — 8-antenna spatial detection", uhfCarrier:"433.92 MHz (EU) — Encrypted bi-directional", cryptoStandard:"AES-128 + MB proprietary EIS challenge", baudRate:"500 kbps CAN — High-speed backbone" };
const VAG: Partial<VehicleSpec> = { transponderCore:"NXP NCF29A1 / HITAG Pro", lfWakeUp:"125 kHz — Spatial polling array", uhfCarrier:"433.92 MHz (EU) — OOK modulated", cryptoStandard:"AES-128 Symmetric with VW Group seed", baudRate:"500 kbps CAN / 2 Mbps CAN-FD" };
const TESLA_P: Partial<VehicleSpec> = { transponderCore:"Proprietary Tesla BLE + NFC chip", lfWakeUp:"N/A — BLE 2.4 GHz passive wake", uhfCarrier:"N/A — BLE 2.4 GHz encrypted channel", cryptoStandard:"Proprietary BLE challenge-response", baudRate:"100 Mbps Ethernet / 500 kbps CAN" };
const VOLVO_P: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-Pro (Geely-era platform)", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code burst", cryptoStandard:"AES-128 Symmetric Encryption", baudRate:"500 kbps CAN / 2 Mbps CAN-FD" };
const HKG: Partial<VehicleSpec> = { transponderCore:"NXP NCF29A1 — Hyundai Mobis", lfWakeUp:"125 kHz — Smart Key polling", uhfCarrier:"433.92 MHz (EU) — FSK modulated", cryptoStandard:"AES-128 with Hyundai Mobis seed", baudRate:"500 kbps CAN — ISO 11898" };
const FORD_P: Partial<VehicleSpec> = { transponderCore:"Texas Instruments TMS37F128 / DST+", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) / 315 MHz (US)", cryptoStandard:"AES-128 Ford SecuriLock", baudRate:"500 kbps CAN / 2 Mbps CAN-FD" };
const HONDA_P: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-3 / PCF7961", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code burst", cryptoStandard:"AES-128 Honda SEED Protocol", baudRate:"500 kbps CAN — ISO 11898" };
const NISSAN_P: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-AES / PCF7952", lfWakeUp:"125 kHz — I-Key polling active", uhfCarrier:"433.92 MHz (EU) — OOK modulated", cryptoStandard:"AES-128 Nissan NATS protocol", baudRate:"500 kbps CAN — ISO 11898" };
const STELLANTIS: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-AES / Continental SVC", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code burst", cryptoStandard:"AES-128 with Stellantis seed", baudRate:"500 kbps CAN — ISO 11898" };
const GM_P: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-Pro / GM Platform", lfWakeUp:"125 kHz — PEPS polling active", uhfCarrier:"315 MHz (US) / 433.92 MHz (EU)", cryptoStandard:"AES-128 GM immobilizer protocol", baudRate:"500 kbps CAN / 2 Mbps CAN-FD" };
const MAZDA_P: Partial<VehicleSpec> = { transponderCore:"NXP Hitag-Pro / PCF7953", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code", cryptoStandard:"AES-128 Mazda seed protocol", baudRate:"500 kbps CAN — ISO 11898" };
const SUBARU_P: Partial<VehicleSpec> = { transponderCore:"Texas Instruments DST80", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — FSK modulated", cryptoStandard:"AES-128 Subaru Starlink", baudRate:"500 kbps CAN — ISO 11898" };

/* ═══════════════════════════════════════════════════════════════
   VEHICLE DATABASE — 40+ Makes, 200+ Models
   ═══════════════════════════════════════════════════════════════ */
const vehicleDatabase: Record<string, MakeData> = {
  "Lexus": { models: {
    "RX 450h":  { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"SmartAccess Passive Entry", canTopology:"Multi-bus: CAN-FD + LIN sub-networks", primaryVulnerability:"CAN-Bus Injection via Headlamp LIN Node", physicalAccessPoint:"Front-left wheel arch liner — LIN harness exposed", telematicsProtocol:"Toyota DCM (Data Communication Module)" }) },
    "NX 350h":  { years: y(2021,2026), spec: s({ ...TNGA, keySystem:"SmartAccess Passive Entry", canTopology:"Gateway ECU → CAN-H/CAN-L twisted pair", primaryVulnerability:"CAN-Bus Injection via Smart Headlamp ECU", physicalAccessPoint:"Front bumper removal — CAN node access", telematicsProtocol:"Toyota DCM v2 (LTE Telematics)" }) },
    "LC 500":   { years: y(2020,2026), spec: s({ ...TNGA, keySystem:"SmartAccess Dual-Band Passive", cryptoStandard:"AES-128 with proprietary Toyota seed", canTopology:"High-Speed CAN 500 kbps backbone", primaryVulnerability:"Relay Attack + CAN Injection (hybrid)", physicalAccessPoint:"Front-left fender well — harness junction" }) },
    "ES 350":   { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"SmartAccess Passive Entry", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"CAN-Bus Injection (Headlamp Node)", physicalAccessPoint:"Front-left wheel arch liner" }) },
    "IS 350":   { years: y(2020,2026), spec: s({ ...TNGA, keySystem:"SmartAccess Passive Entry", canTopology:"High-Speed CAN backbone", primaryVulnerability:"Relay Attack — 433 MHz signal extension", physicalAccessPoint:"Key fob proximity — through-wall relay" }) },
    "UX 250h":  { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"SmartAccess Passive Entry", canTopology:"CAN-FD compact architecture", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "GX 550":   { years: y(2023,2026), spec: s({ ...TNGA, keySystem:"SmartAccess with Digital Key", uwbStatus:"Available — Phase 1 UWB", canTopology:"CAN-FD + Ethernet backbone", primaryVulnerability:"CAN-Bus Injection via body harness" }) },
    "LX 600":   { years: y(2021,2026), spec: s({ ...TNGA, keySystem:"SmartAccess + Fingerprint Start", canTopology:"Multi-domain CAN-FD architecture", primaryVulnerability:"CAN-Bus Injection via headlamp node" }) },
  }},
  "Toyota": { models: {
    "Camry":        { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"Smart Key System", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "RAV4":         { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"Smart Key System", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"CAN-Bus Injection via Headlamp Node", physicalAccessPoint:"Front-left wheel arch liner" }) },
    "Highlander":   { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"Smart Key System", canTopology:"Multi-bus CAN-FD architecture", primaryVulnerability:"CAN-Bus Injection (bumper CAN node)", physicalAccessPoint:"Front bumper removal — CAN access" }) },
    "Land Cruiser": { years: y(2021,2026), spec: s({ ...TNGA, keySystem:"Smart Key + Physical Backup", canTopology:"CAN-FD + Ethernet hybrid", primaryVulnerability:"CAN-Bus Injection via body electronics" }) },
    "GR Supra":     { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"BMW Comfort Access (Z4 platform)", canTopology:"BMW CLAR CAN-FD architecture", primaryVulnerability:"OBD key cloning via diagnostic session", physicalAccessPoint:"OBD-II port — BMW Gateway bypass" }) },
    "Corolla":      { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"Smart Key System", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "Prius":        { years: y(2019,2026), spec: s({ ...TNGA, keySystem:"Smart Key System (Hybrid)", canTopology:"Hybrid CAN + LIN architecture", primaryVulnerability:"Relay Attack — signal extension through wall" }) },
    "Tundra":       { years: y(2021,2026), spec: s({ ...TNGA, keySystem:"Smart Key System", canTopology:"CAN-FD backbone + LIN peripherals", primaryVulnerability:"CAN-Bus Injection via headlamp harness" }) },
    "4Runner":      { years: y(2024,2026), spec: s({ ...TNGA, keySystem:"Smart Key System", canTopology:"CAN-FD + Ethernet backbone", primaryVulnerability:"CAN-Bus Injection via body module" }) },
  }},
  "Land Rover": { models: {
    "Range Rover":       { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS (Passive Entry Passive Start)", canTopology:"Ethernet backbone + CAN-FD sub-domains", primaryVulnerability:"OBD Port CAN Injection / Key Cloning", physicalAccessPoint:"OBD-II port (driver footwell) — direct CAN", requiredMitigation:"Rigid Faraday Attenuation (>85 dB) + OBD lock" }) },
    "Range Rover Sport": { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS (Passive Entry Passive Start)", canTopology:"Ethernet backbone + CAN-FD sub-domains", primaryVulnerability:"OBD Port CAN Injection / Key Cloning", physicalAccessPoint:"OBD-II port (driver footwell)" }) },
    "Defender 110":      { years: y(2020,2026), spec: s({ ...JLR, keySystem:"PEPS with Activity Key", canTopology:"CAN-FD dual-channel isolated domains", primaryVulnerability:"CAN Injection via tow-bar harness node", physicalAccessPoint:"Rear chassis — tow electrics junction box" }) },
    "Discovery":         { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS Passive Entry", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Evoque":            { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS Passive Entry", canTopology:"PTA platform CAN-FD", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Velar":             { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS Passive Entry", canTopology:"D7u platform CAN-FD backbone", primaryVulnerability:"Relay Attack + CAN injection hybrid" }) },
  }},
  "BMW": { models: {
    "3 Series (G20)": { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"BMW Comfort Access Passive", canTopology:"CAN-FD with Central Gateway Module (ZGW)", primaryVulnerability:"Relay Extension + OBD key cloning", physicalAccessPoint:"OBD port — no gateway authentication" }) },
    "5 Series (G60)": { years: y(2023,2026), spec: s({ ...BMW_P, keySystem:"BMW Digital Key Plus (UWB)", uwbStatus:"Available — UWB distance-bounding", canTopology:"Ethernet TSN + CAN-FD zonal", primaryVulnerability:"OBD firmware exploit via diagnostic mode" }) },
    "7 Series (G70)": { years: y(2022,2026), spec: s({ ...BMW_P, keySystem:"BMW Digital Key Plus (UWB + NFC)", uwbStatus:"Available — Full UWB distance-bounding", canTopology:"Ethernet TSN backbone + CAN-FD zones", primaryVulnerability:"Advanced OBD programming exploit" }) },
    "X3 (G45)":       { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"BMW Comfort Access", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "X5 (G05)":       { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"BMW Digital Key Plus (UWB optional)", uwbStatus:"Available — UWB distance-bounding active", canTopology:"Ethernet TSN backbone + CAN-FD zones", primaryVulnerability:"Game Boy device OBD key programming", physicalAccessPoint:"OBD-II port — Gateway bypass firmware" }) },
    "X7":             { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"BMW Comfort Access + Digital Key", uwbStatus:"Available on 2023+ models", canTopology:"Ethernet TSN + CAN-FD architecture", primaryVulnerability:"OBD key cloning via SVM exploit" }) },
    "i4":             { years: y(2021,2026), spec: s({ ...BMW_P, keySystem:"BMW Digital Key (NFC + UWB)", uwbStatus:"Available — Full UWB active", canTopology:"Ethernet backbone + CAN-FD zones", primaryVulnerability:"BLE/UWB relay amplification (theoretical)" }) },
    "iX":             { years: y(2021,2026), spec: s({ ...BMW_P, keySystem:"BMW Digital Key Plus (UWB + NFC + BLE)", uwbStatus:"Available — Full UWB distance-bounding", canTopology:"Ethernet-first zonal architecture", primaryVulnerability:"Advanced OBD firmware programming" }) },
    "M3 / M4":        { years: y(2021,2026), spec: s({ ...BMW_P, keySystem:"BMW Comfort Access + M Digital Key", uwbStatus:"Available on 2024+ models", canTopology:"CAN-FD with M-tuned ECU network", primaryVulnerability:"OBD key cloning via diagnostic session" }) },
  }},
  "Mercedes-Benz": { models: {
    "C-Class (W206)": { years: y(2021,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO with HANDS-FREE ACCESS", uwbStatus:"Available on AMG Line packages", canTopology:"Star topology — Central compute platform", primaryVulnerability:"Relay extension via pouch degradation" }) },
    "E-Class (W214)": { years: y(2023,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO + MB Digital Key", uwbStatus:"Available — UWB Phase 2", canTopology:"Star topology — Central MBUX compute", primaryVulnerability:"EIS takeover via OBD frame injection", physicalAccessPoint:"OBD-II port — EIS authentication bypass" }) },
    "S-Class (W223)": { years: y(2020,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO + Fingerprint + UWB", uwbStatus:"Available — Full UWB distance-bounding", canTopology:"Star topology — MBUX central compute", primaryVulnerability:"Advanced EIS takeover (OBD direct)", physicalAccessPoint:"OBD-II port — Electronic Ignition Switch" }) },
    "GLE 450":        { years: y(2019,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO Passive Entry", canTopology:"MOST bus + CAN backbone + LIN", primaryVulnerability:"EIS Takeover via OBD direct frame injection" }) },
    "GLC 300":        { years: y(2019,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO Passive Entry", canTopology:"CAN backbone + LIN peripherals", primaryVulnerability:"Relay Attack + EIS cloning" }) },
    "G-Class (W463)": { years: y(2019,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO + Physical Key", canTopology:"Legacy CAN + modern LIN", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "AMG GT":         { years: y(2019,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO AMG Performance", canTopology:"High-speed CAN backbone + MOST", primaryVulnerability:"EIS cloning via OBD injection" }) },
    "EQS":            { years: y(2021,2026), spec: s({ ...MB_P, keySystem:"KEYLESS-GO + Digital Key (NFC/UWB)", uwbStatus:"Available — Full UWB active", canTopology:"EVA2 Ethernet-first architecture", primaryVulnerability:"Advanced OBD EIS programming exploit" }) },
  }},
  "Audi": { models: {
    "A4": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key", canTopology:"MLB Evo CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "A6": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key", canTopology:"MLB Evo CAN-FD backbone", primaryVulnerability:"OBD key cloning + Relay Attack" }) },
    "A8": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key + Digital Key", uwbStatus:"Available on 2024+ models", canTopology:"MLB Evo Premium CAN-FD + Ethernet", primaryVulnerability:"Advanced OBD key programming" }) },
    "Q5": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key", canTopology:"MLB Evo CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + CAN injection" }) },
    "Q7": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key", canTopology:"MLB Evo CAN-FD multi-domain", primaryVulnerability:"OBD key cloning via VCDS exploit" }) },
    "Q8": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key", canTopology:"MLB Evo Premium CAN-FD", primaryVulnerability:"Relay Attack + OBD cloning hybrid" }) },
    "e-tron GT": { years: y(2021,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key + Digital Key", uwbStatus:"Available — J1 platform UWB", canTopology:"J1 Ethernet + CAN-FD architecture", primaryVulnerability:"BLE/UWB relay (theoretical)" }) },
    "RS6 Avant": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Audi Advanced Key", canTopology:"MLB Evo Performance CAN-FD", primaryVulnerability:"OBD key cloning + Relay Attack" }) },
  }},
  "Porsche": { models: {
    "Cayenne":   { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Porsche Entry & Drive Passive", canTopology:"CAN-FD + FlexRay backbone", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Macan":     { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Porsche Entry & Drive", canTopology:"MLB Evo CAN-FD platform", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Taycan":    { years: y(2020,2026), spec: s({ ...VAG, keySystem:"Porsche Entry & Drive + Digital Key", uwbStatus:"Available — J1 UWB active", canTopology:"J1 Ethernet-first + CAN-FD zones", primaryVulnerability:"BLE/UWB relay amplification" }) },
    "911 (992)": { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Porsche Entry & Drive Passive", canTopology:"Hybrid CAN-FD / Ethernet backbone", primaryVulnerability:"OBD key programming exploit" }) },
    "Panamera":  { years: y(2019,2026), spec: s({ ...VAG, keySystem:"Porsche Entry & Drive Passive", canTopology:"MSB platform CAN-FD + Ethernet", primaryVulnerability:"Relay Attack + OBD programming" }) },
  }},
  "Tesla": { models: {
    "Model 3": { years: y(2019,2026), spec: s({ ...TESLA_P, keySystem:"Phone Key + NFC Key Card", canTopology:"Ethernet backbone + CAN (legacy)", primaryVulnerability:"BLE Relay Attack via phone key", physicalAccessPoint:"BLE range extension — smartphone proximity", requiredMitigation:"Phone key BLE hardening + PIN-to-Drive" }) },
    "Model Y": { years: y(2020,2026), spec: s({ ...TESLA_P, keySystem:"Phone Key + NFC Key Card", canTopology:"Ethernet + CAN hybrid backbone", primaryVulnerability:"BLE Relay Attack via phone key", physicalAccessPoint:"BLE range extension — smartphone" }) },
    "Model S":  { years: y(2019,2026), spec: s({ ...TESLA_P, keySystem:"Phone Key + Key Fob + NFC", uwbStatus:"Available on 2023+ Refresh", canTopology:"Ethernet-first architecture", primaryVulnerability:"BLE Relay + key fob relay (older models)" }) },
    "Model X":  { years: y(2019,2026), spec: s({ ...TESLA_P, keySystem:"Phone Key + Key Fob + NFC", uwbStatus:"Available on 2023+ Refresh", canTopology:"Ethernet-first architecture", primaryVulnerability:"BLE Relay + key fob relay (older models)" }) },
    "Cybertruck": { years: y(2024,2026), spec: s({ ...TESLA_P, keySystem:"Phone Key + UWB + NFC Card", uwbStatus:"Available — Full UWB active", canTopology:"Ethernet-first zonal + 48V CAN", primaryVulnerability:"BLE relay (theoretical — UWB mitigates)" }) },
  }},
  "Volvo": { models: {
    "XC90": { years: y(2019,2026), spec: s({ ...VOLVO_P, keySystem:"Keyless Entry with Pilot Assist", canTopology:"SPA2 CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "XC60": { years: y(2019,2026), spec: s({ ...VOLVO_P, keySystem:"Keyless Entry Passive", canTopology:"SPA CAN-FD backbone", primaryVulnerability:"Relay Attack — signal extension" }) },
    "XC40": { years: y(2019,2026), spec: s({ ...VOLVO_P, keySystem:"Keyless Entry + Digital Key", canTopology:"CMA platform CAN + LIN", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "S90":  { years: y(2019,2026), spec: s({ ...VOLVO_P, keySystem:"Keyless Entry with PA", canTopology:"SPA CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "EX90": { years: y(2024,2026), spec: s({ ...VOLVO_P, keySystem:"Digital Key + UWB", uwbStatus:"Available — Full UWB active", canTopology:"SPA3 Ethernet-first architecture", primaryVulnerability:"BLE relay amplification (theoretical)" }) },
  }},
  "Hyundai": { models: {
    "Tucson":    { years: y(2021,2026), spec: s({ ...HKG, keySystem:"Smart Key Passive Entry", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Santa Fe":  { years: y(2019,2026), spec: s({ ...HKG, keySystem:"Smart Key + Digital Key", canTopology:"CAN-FD backbone", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Palisade":  { years: y(2020,2026), spec: s({ ...HKG, keySystem:"Smart Key Passive", canTopology:"CAN-FD + LIN peripherals", primaryVulnerability:"Relay Attack — signal extension" }) },
    "Ioniq 5":   { years: y(2021,2026), spec: s({ ...HKG, keySystem:"Digital Key + NFC", uwbStatus:"Available on 2024+ models", canTopology:"E-GMP Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
    "Ioniq 6":   { years: y(2022,2026), spec: s({ ...HKG, keySystem:"Digital Key + NFC", uwbStatus:"Available on 2024+ models", canTopology:"E-GMP Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
    "Kona":      { years: y(2019,2026), spec: s({ ...HKG, keySystem:"Smart Key Passive Entry", canTopology:"CAN + LIN compact architecture", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
  }},
  "Kia": { models: {
    "Sportage":  { years: y(2021,2026), spec: s({ ...HKG, keySystem:"Smart Key Passive Entry", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Sorento":   { years: y(2020,2026), spec: s({ ...HKG, keySystem:"Smart Key + Digital Key", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Telluride": { years: y(2020,2026), spec: s({ ...HKG, keySystem:"Smart Key Passive", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack — signal extension" }) },
    "EV6":       { years: y(2021,2026), spec: s({ ...HKG, keySystem:"Digital Key + NFC", uwbStatus:"Available on 2024+ models", canTopology:"E-GMP Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
    "EV9":       { years: y(2023,2026), spec: s({ ...HKG, keySystem:"Digital Key + UWB", uwbStatus:"Available — UWB active", canTopology:"E-GMP Ethernet-first + CAN-FD", primaryVulnerability:"BLE relay (theoretical — UWB mitigates)" }) },
    "Stinger":   { years: y(2019,2024), spec: s({ ...HKG, keySystem:"Smart Key Passive Entry", canTopology:"CAN-FD backbone", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
  }},
  "Genesis": { models: {
    "G70": { years: y(2019,2026), spec: s({ ...HKG, keySystem:"Smart Key + Digital Key", canTopology:"CAN-FD backbone", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "G80": { years: y(2020,2026), spec: s({ ...HKG, keySystem:"Smart Key + NFC Digital Key", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "G90": { years: y(2022,2026), spec: s({ ...HKG, keySystem:"Face Recognition + Digital Key", uwbStatus:"Available — UWB Phase 1", canTopology:"Ethernet backbone + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
    "GV70": { years: y(2021,2026), spec: s({ ...HKG, keySystem:"Smart Key + NFC Digital Key", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "GV80": { years: y(2020,2026), spec: s({ ...HKG, keySystem:"Smart Key + Digital Key", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"Relay Attack — signal extension" }) },
  }},
  "Ford": { models: {
    "F-150":      { years: y(2019,2026), spec: s({ ...FORD_P, keySystem:"SecuriLock Passive Anti-Theft", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Mustang":    { years: y(2019,2026), spec: s({ ...FORD_P, keySystem:"SecuriLock Passive Entry", canTopology:"CAN-FD backbone", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Explorer":   { years: y(2020,2026), spec: s({ ...FORD_P, keySystem:"SecuriLock PATS Passive", canTopology:"CAN-FD + LIN peripherals", primaryVulnerability:"OBD key cloning + Relay Attack" }) },
    "Bronco":     { years: y(2021,2026), spec: s({ ...FORD_P, keySystem:"SecuriLock Passive Entry", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"Relay Attack — signal extension" }) },
    "Mach-E":     { years: y(2021,2026), spec: s({ ...FORD_P, keySystem:"Phone-as-Key + Key Fob", uwbStatus:"Absent — BLE-based phone key", canTopology:"Ethernet backbone + CAN-FD zones", primaryVulnerability:"BLE relay via phone-as-key" }) },
    "Ranger":     { years: y(2019,2026), spec: s({ ...FORD_P, keySystem:"SecuriLock PATS", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"OBD key cloning via diagnostic session" }) },
  }},
  "Honda": { models: {
    "CR-V":    { years: y(2019,2026), spec: s({ ...HONDA_P, keySystem:"Smart Entry Passive", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "Civic":   { years: y(2019,2026), spec: s({ ...HONDA_P, keySystem:"Smart Entry Passive", canTopology:"CAN + LIN architecture", primaryVulnerability:"Relay Attack — signal extension" }) },
    "Accord":  { years: y(2019,2026), spec: s({ ...HONDA_P, keySystem:"Smart Entry Passive", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + Rolling code exploit" }) },
    "Pilot":   { years: y(2019,2026), spec: s({ ...HONDA_P, keySystem:"Smart Entry Passive", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "HR-V":    { years: y(2019,2026), spec: s({ ...HONDA_P, keySystem:"Smart Entry Passive", canTopology:"CAN + LIN compact", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
  }},
  "Nissan": { models: {
    "Rogue":    { years: y(2019,2026), spec: s({ ...NISSAN_P, keySystem:"Nissan Intelligent Key", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
    "Pathfinder": { years: y(2022,2026), spec: s({ ...NISSAN_P, keySystem:"Intelligent Key Passive", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Altima":   { years: y(2019,2026), spec: s({ ...NISSAN_P, keySystem:"Intelligent Key Passive", canTopology:"CAN + LIN architecture", primaryVulnerability:"Relay Attack — signal extension" }) },
    "370Z / Z": { years: y(2019,2026), spec: s({ ...NISSAN_P, keySystem:"Intelligent Key Passive", canTopology:"CAN backbone", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Ariya":    { years: y(2022,2026), spec: s({ ...NISSAN_P, keySystem:"Intelligent Key + Digital Key", uwbStatus:"Available on ProPILOT models", canTopology:"CMF-EV Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
  }},
  "Mazda": { models: {
    "CX-5":    { years: y(2019,2026), spec: s({ ...MAZDA_P, keySystem:"Advanced Keyless Entry", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "CX-50":   { years: y(2022,2026), spec: s({ ...MAZDA_P, keySystem:"Advanced Keyless Entry", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack — signal extension" }) },
    "CX-90":   { years: y(2023,2026), spec: s({ ...MAZDA_P, keySystem:"Advanced Keyless + Digital Key", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Mazda3":  { years: y(2019,2026), spec: s({ ...MAZDA_P, keySystem:"Advanced Keyless Entry", canTopology:"CAN + LIN architecture", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "MX-5":    { years: y(2019,2026), spec: s({ ...MAZDA_P, keySystem:"Advanced Keyless Entry", canTopology:"CAN backbone (simplified)", primaryVulnerability:"Relay Attack — 433 MHz signal extension" }) },
  }},
  "Subaru": { models: {
    "Outback":   { years: y(2019,2026), spec: s({ ...SUBARU_P, keySystem:"Keyless Access Passive Entry", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Forester":  { years: y(2019,2026), spec: s({ ...SUBARU_P, keySystem:"Keyless Access Passive", canTopology:"CAN + LIN architecture", primaryVulnerability:"Relay Attack — signal extension" }) },
    "WRX":       { years: y(2019,2026), spec: s({ ...SUBARU_P, keySystem:"Keyless Access Passive Entry", canTopology:"CAN-FD backbone", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Crosstrek": { years: y(2019,2026), spec: s({ ...SUBARU_P, keySystem:"Keyless Access Passive", canTopology:"CAN + LIN compact", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Solterra":  { years: y(2022,2026), spec: s({ ...SUBARU_P, keySystem:"Digital Key + NFC", uwbStatus:"Absent — BLE only", canTopology:"e-TNGA Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
  }},
  "Volkswagen": { models: {
    "Golf":     { years: y(2019,2026), spec: s({ ...VAG, keySystem:"KESSY Passive Entry", canTopology:"MQB Evo CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Tiguan":   { years: y(2019,2026), spec: s({ ...VAG, keySystem:"KESSY Passive Entry", canTopology:"MQB CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Atlas":    { years: y(2019,2026), spec: s({ ...VAG, keySystem:"KESSY Passive Entry", canTopology:"MQB CAN-FD backbone", primaryVulnerability:"Relay Attack — signal extension" }) },
    "ID.4":     { years: y(2021,2026), spec: s({ ...VAG, keySystem:"KESSY + Digital Key", uwbStatus:"Available on Pro S trim", canTopology:"MEB Ethernet + CAN-FD zones", primaryVulnerability:"BLE relay via Digital Key" }) },
    "Touareg":  { years: y(2019,2026), spec: s({ ...VAG, keySystem:"KESSY Advanced Passive", canTopology:"MLB Evo CAN-FD + Ethernet", primaryVulnerability:"OBD key cloning + Relay Attack" }) },
  }},
  "Jaguar": { models: {
    "F-Pace":  { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS Passive Entry", canTopology:"D7u platform CAN-FD", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "E-Pace":  { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS Passive Entry", canTopology:"D7a platform CAN + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "I-Pace":  { years: y(2019,2026), spec: s({ ...JLR, keySystem:"PEPS + Activity Key", uwbStatus:"Absent — 433 MHz only", canTopology:"Dedicated EV CAN-FD backbone", primaryVulnerability:"Relay Attack + OBD port exploit" }) },
    "XF":      { years: y(2019,2024), spec: s({ ...JLR, keySystem:"PEPS Passive Entry", canTopology:"D7a platform CAN-FD", primaryVulnerability:"Relay Attack + OBD cloning" }) },
  }},
  "Bentley": { models: {
    "Bentayga":     { years: y(2019,2026), spec: s({ ...VAG, transponderCore:"NXP NCF29A1 — Bentley specification", keySystem:"Bentley Keyless Entry", canTopology:"MLB Evo Premium CAN-FD + FlexRay", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Continental GT": { years: y(2019,2026), spec: s({ ...VAG, transponderCore:"NXP NCF29A1 — Bentley specification", keySystem:"Bentley Keyless Entry", canTopology:"MSB platform CAN-FD + Ethernet", primaryVulnerability:"OBD key programming exploit" }) },
    "Flying Spur":   { years: y(2019,2026), spec: s({ ...VAG, transponderCore:"NXP NCF29A1 — Bentley specification", keySystem:"Bentley Keyless + Biometric", canTopology:"MSB platform CAN-FD", primaryVulnerability:"Relay Attack + OBD cloning" }) },
  }},
  "Rolls-Royce": { models: {
    "Ghost":   { years: y(2020,2026), spec: s({ ...BMW_P, transponderCore:"NXP S32K — Rolls-Royce specification", keySystem:"Spirit of Ecstasy Key", canTopology:"BMW CLAR Ethernet TSN + CAN-FD", primaryVulnerability:"Advanced OBD key programming" }) },
    "Cullinan": { years: y(2019,2026), spec: s({ ...BMW_P, transponderCore:"NXP S32K — Rolls-Royce specification", keySystem:"Spirit of Ecstasy Key", canTopology:"BMW CLAR CAN-FD + Ethernet", primaryVulnerability:"OBD key cloning via diagnostic mode" }) },
    "Spectre":  { years: y(2023,2026), spec: s({ ...BMW_P, transponderCore:"NXP S32K — Rolls-Royce specification", keySystem:"Spirit of Ecstasy Digital Key + UWB", uwbStatus:"Available — Full UWB active", canTopology:"Ethernet-first architecture", primaryVulnerability:"Advanced OBD firmware exploit" }) },
  }},
  "Maserati": { models: {
    "Ghibli":     { years: y(2019,2024), spec: s({ ...STELLANTIS, transponderCore:"NXP Hitag-AES — Maserati spec", keySystem:"Keyless Entry Passive", canTopology:"Giorgio platform CAN + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Levante":    { years: y(2019,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Hitag-AES — Maserati spec", keySystem:"Keyless Entry Passive", canTopology:"Giorgio platform CAN-FD", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "GranTurismo": { years: y(2023,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP NCF29A1 — Maserati Folgore", keySystem:"Keyless + Digital Key", canTopology:"STLA Large CAN-FD + Ethernet", primaryVulnerability:"OBD key programming exploit" }) },
  }},
  "Ferrari": { models: {
    "Roma":      { years: y(2020,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Secure Element — Ferrari spec", keySystem:"Ferrari Passive Entry", canTopology:"Proprietary CAN-FD backbone", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "296 GTB":   { years: y(2022,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Secure Element — Ferrari spec", keySystem:"Ferrari Passive Entry + Fingerprint", canTopology:"Proprietary CAN-FD + Ethernet", primaryVulnerability:"OBD firmware exploit (limited)" }) },
    "SF90":      { years: y(2020,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Secure Element — Ferrari spec", keySystem:"Ferrari Passive Entry + Biometric", canTopology:"Hybrid CAN-FD + Ethernet backbone", primaryVulnerability:"Advanced OBD programming exploit" }) },
    "Purosangue": { years: y(2023,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Secure Element — Ferrari spec", keySystem:"Ferrari Passive Entry + Digital Key", canTopology:"Proprietary CAN-FD + Ethernet", primaryVulnerability:"Relay Attack + OBD exploit" }) },
  }},
  "Lamborghini": { models: {
    "Urus":     { years: y(2019,2026), spec: s({ ...VAG, transponderCore:"NXP NCF29A1 — Lamborghini spec", keySystem:"Lamborghini Keyless Entry", canTopology:"MLB Evo CAN-FD + FlexRay", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Huracán":  { years: y(2019,2024), spec: s({ ...VAG, transponderCore:"NXP NCF29A1 — Lamborghini spec", keySystem:"Lamborghini Keyless Entry", canTopology:"Proprietary CAN-FD backbone", primaryVulnerability:"OBD key programming exploit" }) },
    "Revuelto": { years: y(2024,2026), spec: s({ ...VAG, transponderCore:"NXP Secure Element — Lamborghini spec", keySystem:"Digital Key + Passive Entry", uwbStatus:"Available — UWB Phase 1", canTopology:"Hybrid CAN-FD + Ethernet", primaryVulnerability:"BLE relay (theoretical)" }) },
  }},
  "Aston Martin": { models: {
    "DB12":    { years: y(2023,2026), spec: s({ ...MB_P, transponderCore:"NXP NCF29A1 — Aston Martin spec", keySystem:"Crystal Key Passive Entry", canTopology:"CAN-FD + Ethernet backbone", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "DBX 707": { years: y(2022,2026), spec: s({ ...MB_P, transponderCore:"NXP NCF29A1 — Aston Martin spec", keySystem:"Crystal Key Passive Entry", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Vantage":  { years: y(2019,2026), spec: s({ ...MB_P, transponderCore:"NXP NCF29A1 — Aston Martin spec", keySystem:"Crystal Key Passive", canTopology:"CAN backbone + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
  }},
  "Chevrolet": { models: {
    "Silverado": { years: y(2019,2026), spec: s({ ...GM_P, keySystem:"GM PEPS Passive Entry", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Corvette":  { years: y(2020,2026), spec: s({ ...GM_P, keySystem:"GM PEPS + Performance Key", canTopology:"CAN-FD backbone + Ethernet", primaryVulnerability:"OBD key cloning via diagnostic mode" }) },
    "Tahoe":     { years: y(2019,2026), spec: s({ ...GM_P, keySystem:"GM PEPS Passive Entry", canTopology:"CAN-FD + LIN peripherals", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Equinox EV": { years: y(2024,2026), spec: s({ ...GM_P, keySystem:"GM Digital Key + NFC", uwbStatus:"Available — UWB Phase 1", canTopology:"Ultium Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
    "Blazer EV":  { years: y(2024,2026), spec: s({ ...GM_P, keySystem:"GM Digital Key + NFC", uwbStatus:"Available — UWB Phase 1", canTopology:"Ultium Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
  }},
  "Cadillac": { models: {
    "Escalade":  { years: y(2019,2026), spec: s({ ...GM_P, transponderCore:"NXP Hitag-Pro — Cadillac spec", keySystem:"Remote Keyless Entry + PEPS", canTopology:"CAN-FD + Ethernet backbone", primaryVulnerability:"OBD key cloning + Relay Attack" }) },
    "CT5":       { years: y(2020,2026), spec: s({ ...GM_P, transponderCore:"NXP Hitag-Pro — Cadillac spec", keySystem:"Remote Keyless + PEPS", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"Relay Attack — 315 MHz extension" }) },
    "Lyriq":     { years: y(2023,2026), spec: s({ ...GM_P, transponderCore:"NXP Hitag-Pro — Cadillac spec", keySystem:"GM Digital Key + NFC + UWB", uwbStatus:"Available — Full UWB active", canTopology:"Ultium Ethernet-first architecture", primaryVulnerability:"BLE relay (theoretical — UWB mitigates)" }) },
  }},
  "Dodge": { models: {
    "Charger":    { years: y(2019,2024), spec: s({ ...STELLANTIS, keySystem:"Keyless Enter-N-Go", canTopology:"CAN + LIN legacy architecture", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Durango":    { years: y(2019,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Enter-N-Go", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Hornet":     { years: y(2023,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Enter-N-Go + Digital Key", canTopology:"STLA Medium CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
  }},
  "Jeep": { models: {
    "Grand Cherokee": { years: y(2019,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Enter-N-Go", canTopology:"STLA Frame CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "Wrangler":       { years: y(2019,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Enter-N-Go", canTopology:"CAN + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Wagoneer":       { years: y(2022,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Enter-N-Go Premium", canTopology:"CAN-FD + Ethernet backbone", primaryVulnerability:"OBD key cloning + Relay Attack" }) },
  }},
  "Lincoln": { models: {
    "Navigator":  { years: y(2019,2026), spec: s({ ...FORD_P, transponderCore:"TI DST+ — Lincoln specification", keySystem:"Phone-as-Key + Key Fob", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Aviator":    { years: y(2020,2026), spec: s({ ...FORD_P, transponderCore:"TI DST+ — Lincoln specification", keySystem:"Phone-as-Key + Key Fob", canTopology:"CAN-FD backbone + LIN", primaryVulnerability:"BLE relay via phone-as-key" }) },
    "Corsair":    { years: y(2020,2026), spec: s({ ...FORD_P, transponderCore:"TI DST+ — Lincoln specification", keySystem:"SecuriLock Passive Entry", canTopology:"CAN-FD + LIN compact", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
  }},
  "Infiniti": { models: {
    "QX80":  { years: y(2019,2026), spec: s({ ...NISSAN_P, transponderCore:"NXP Hitag-AES — Infiniti spec", keySystem:"Intelligent Key Passive", canTopology:"CAN-FD + LIN architecture", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
    "QX60":  { years: y(2022,2026), spec: s({ ...NISSAN_P, transponderCore:"NXP Hitag-AES — Infiniti spec", keySystem:"Intelligent Key Passive", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Q50":   { years: y(2019,2024), spec: s({ ...NISSAN_P, transponderCore:"NXP Hitag-AES — Infiniti spec", keySystem:"Intelligent Key Passive", canTopology:"CAN backbone + LIN", primaryVulnerability:"Relay Attack — signal extension" }) },
  }},
  "Acura": { models: {
    "MDX":  { years: y(2019,2026), spec: s({ ...HONDA_P, transponderCore:"NXP Hitag-3 — Acura specification", keySystem:"AcuraLink Smart Entry", canTopology:"CAN-FD + LIN sub-networks", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "TLX":  { years: y(2021,2026), spec: s({ ...HONDA_P, transponderCore:"NXP Hitag-3 — Acura specification", keySystem:"AcuraLink Smart Entry", canTopology:"CAN-FD backbone", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Integra": { years: y(2023,2026), spec: s({ ...HONDA_P, transponderCore:"NXP Hitag-3 — Acura specification", keySystem:"AcuraLink Smart Entry", canTopology:"CAN + LIN compact architecture", primaryVulnerability:"Relay Attack — signal extension" }) },
  }},
  "Alfa Romeo": { models: {
    "Giulia":     { years: y(2019,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Hitag-AES — Alfa spec", keySystem:"Keyless Entry Passive", canTopology:"Giorgio platform CAN-FD", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Stelvio":    { years: y(2019,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Hitag-AES — Alfa spec", keySystem:"Keyless Entry Passive", canTopology:"Giorgio platform CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Tonale":     { years: y(2023,2026), spec: s({ ...STELLANTIS, transponderCore:"NXP Hitag-AES — Alfa spec", keySystem:"Keyless + NFT Digital Key", canTopology:"STLA Medium CAN-FD + LIN", primaryVulnerability:"BLE relay via NFT key" }) },
  }},
  "Peugeot": { models: {
    "3008": { years: y(2019,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Entry Passive", canTopology:"EMP2 CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "5008": { years: y(2019,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Entry Passive", canTopology:"EMP2 CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "e-208": { years: y(2020,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Entry + Digital Key", canTopology:"eCMP CAN-FD + LIN", primaryVulnerability:"Relay Attack — signal extension" }) },
  }},
  "Renault": { models: {
    "Megane E-Tech": { years: y(2022,2026), spec: s({ transponderCore:"NXP Hitag-AES / Continental", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code", cryptoStandard:"AES-128 with Renault seed", baudRate:"500 kbps CAN-FD", keySystem:"Hands-Free Card + Digital Key", uwbStatus:"Absent — 433 MHz only", canTopology:"CMF-EV CAN-FD + Ethernet", primaryVulnerability:"Relay Attack via card proximity" }) },
    "Austral":       { years: y(2022,2026), spec: s({ transponderCore:"NXP Hitag-AES / Continental", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code", cryptoStandard:"AES-128 with Renault seed", baudRate:"500 kbps CAN-FD", keySystem:"Hands-Free Card Passive", canTopology:"CMF-CD CAN-FD + LIN", primaryVulnerability:"Relay Attack — card signal extension" }) },
    "Espace":        { years: y(2023,2026), spec: s({ transponderCore:"NXP Hitag-AES / Continental", lfWakeUp:"125 kHz — Passive polling active", uhfCarrier:"433.92 MHz (EU) — Rolling code", cryptoStandard:"AES-128 with Renault seed", baudRate:"500 kbps CAN-FD", keySystem:"Hands-Free Card Passive", canTopology:"CMF-CD CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
  }},
  "MINI": { models: {
    "Cooper": { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"MINI Comfort Access", canTopology:"UKL2 platform CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Countryman": { years: y(2019,2026), spec: s({ ...BMW_P, keySystem:"MINI Comfort Access", canTopology:"FAAR platform CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Clubman": { years: y(2019,2024), spec: s({ ...BMW_P, keySystem:"MINI Comfort Access", canTopology:"UKL2 platform CAN + LIN", primaryVulnerability:"Relay Attack + OBD key cloning" }) },
  }},
  "Citroën": { models: {
    "C5 Aircross": { years: y(2019,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Entry Passive", canTopology:"EMP2 CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "ë-C4": { years: y(2021,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Entry + Digital Key", canTopology:"eCMP CAN-FD + LIN", primaryVulnerability:"Relay Attack — signal extension" }) },
    "C5 X": { years: y(2022,2026), spec: s({ ...STELLANTIS, keySystem:"Keyless Entry Passive", canTopology:"EMP2 CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
  }},
  "CUPRA": { models: {
    "Formentor": { years: y(2020,2026), spec: s({ ...VAG, keySystem:"KESSY Passive Entry", canTopology:"MQB Evo CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Born":      { years: y(2021,2026), spec: s({ ...VAG, keySystem:"KESSY + Digital Key", uwbStatus:"Available on VZ trim", canTopology:"MEB Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
    "Tavascan":  { years: y(2024,2026), spec: s({ ...VAG, keySystem:"KESSY + Digital Key + UWB", uwbStatus:"Available — UWB Phase 1", canTopology:"MEB+ Ethernet + CAN-FD zones", primaryVulnerability:"BLE relay (theoretical)" }) },
  }},
  "Škoda": { models: {
    "Kodiaq":  { years: y(2019,2026), spec: s({ ...VAG, keySystem:"KESSY Passive Entry", canTopology:"MQB CAN-FD + LIN", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
    "Superb":  { years: y(2019,2026), spec: s({ ...VAG, keySystem:"KESSY Passive Entry", canTopology:"MQB CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Enyaq":   { years: y(2021,2026), spec: s({ ...VAG, keySystem:"KESSY + Digital Key", uwbStatus:"Available on vRS trim", canTopology:"MEB Ethernet + CAN-FD", primaryVulnerability:"BLE relay via Digital Key" }) },
  }},
  "Mitsubishi": { models: {
    "Outlander": { years: y(2022,2026), spec: s({ ...NISSAN_P, transponderCore:"NXP Hitag-AES — Mitsubishi spec", keySystem:"Keyless Operating System", canTopology:"CMF-CD CAN-FD + LIN", primaryVulnerability:"Relay Attack + OBD cloning" }) },
    "Eclipse Cross": { years: y(2019,2026), spec: s({ ...NISSAN_P, transponderCore:"NXP Hitag-AES — Mitsubishi spec", keySystem:"Keyless Entry Passive", canTopology:"CAN + LIN architecture", primaryVulnerability:"Relay Attack — 433 MHz extension" }) },
  }},
};

/* ═══════════════════════════════════════════════════════════════
   THREAT LEVEL CALCULATION
   ═══════════════════════════════════════════════════════════════ */
function calcThreatLevel(spec: VehicleSpec): { level: ThreatLevel; score: number; summary: string } {
  let score = 50;
  const v = spec.primaryVulnerability.toLowerCase();
  const uwb = spec.uwbStatus.toLowerCase();
  if (v.includes("can-bus injection") || v.includes("can injection")) score += 28;
  else if (v.includes("obd") && v.includes("cloning")) score += 20;
  else if (v.includes("eis takeover")) score += 25;
  else if (v.includes("relay attack") || v.includes("relay extension")) score += 15;
  else if (v.includes("ble relay")) score += 10;
  if (uwb.includes("full uwb")) score -= 25;
  else if (uwb.includes("available") && uwb.includes("uwb")) score -= 15;
  else if (uwb.includes("absent") || uwb.includes("n/a")) score += 8;
  if (spec.cryptoStandard.toLowerCase().includes("proprietary")) score += 3;
  if (v.includes("theoretical")) score -= 12;
  if (v.includes("hybrid")) score += 5;
  score = Math.max(5, Math.min(98, score));
  let level: ThreatLevel;
  let summary: string;
  if (score >= 75) { level = "CRITICAL"; summary = "This vehicle presents critical security exposure. CAN-bus injection or EIS takeover vectors allow sub-60-second compromise. Immediate hardware countermeasures required."; }
  else if (score >= 55) { level = "HIGH"; summary = "Significant vulnerabilities identified. OBD cloning and relay attack vectors present substantial risk. Faraday attenuation and OBD port hardening strongly recommended."; }
  else if (score >= 35) { level = "MODERATE"; summary = "Standard keyless entry vulnerabilities present. Relay attack mitigation via rigid RF shielding recommended. Partial UWB implementation reduces but does not eliminate risk."; }
  else if (score >= 20) { level = "LOW"; summary = "Reduced threat profile due to UWB distance-bounding and advanced key cryptography. Residual BLE relay risk remains theoretical."; }
  else { level = "SECURE"; summary = "Advanced security architecture with full UWB distance-bounding significantly mitigates known attack vectors. Monitor for emerging exploits."; }
  return { level, score, summary };
}

const THREAT_THEME = {
  CRITICAL: { bg: "bg-red-500/[0.04]", border: "border-red-500/20", text: "text-red-400", glow: "animate-threat-critical", barColor: "from-red-600 via-red-500 to-orange-500", gaugeColor: "text-red-500", icon: <ShieldAlert size={32} /> },
  HIGH:     { bg: "bg-amber-500/[0.04]", border: "border-amber-500/15", text: "text-amber-400", glow: "animate-threat-high", barColor: "from-amber-600 via-amber-500 to-yellow-500", gaugeColor: "text-amber-500", icon: <AlertTriangle size={32} /> },
  MODERATE: { bg: "bg-sky-500/[0.03]", border: "border-sky-500/12", text: "text-sky-400", glow: "animate-threat-moderate", barColor: "from-sky-600 via-sky-500 to-cyan-400", gaugeColor: "text-sky-500", icon: <Shield size={32} /> },
  LOW:      { bg: "bg-emerald-500/[0.03]", border: "border-emerald-500/12", text: "text-emerald-400", glow: "animate-threat-secure", barColor: "from-emerald-600 via-emerald-500 to-teal-400", gaugeColor: "text-emerald-500", icon: <ShieldCheck size={32} /> },
  SECURE:   { bg: "bg-emerald-500/[0.03]", border: "border-emerald-500/12", text: "text-emerald-400", glow: "animate-threat-secure", barColor: "from-emerald-600 via-emerald-500 to-teal-400", gaugeColor: "text-emerald-500", icon: <ShieldCheck size={32} /> },
};

/* ═══════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════ */
const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "status",  label: "Security Status",  icon: <Shield size={14} /> },
  { id: "signal",  label: "RF Intelligence",  icon: <Radar size={14} /> },
  { id: "network", label: "Network & Crypto", icon: <Network size={14} /> },
  { id: "threats", label: "Threat Matrix",     icon: <Target size={14} /> },
  { id: "report",  label: "Full Report",       icon: <FileText size={14} /> },
];

/* ═══════════════════════════════════════════════════════════════
   GAUGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function ThreatGauge({ score, color }: { score: number; color: string }) {
  const r = 70, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-44 h-44 flex-shrink-0">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="currentColor"
          className={`${color} animate-gauge-stroke animate-gauge-glow`}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-mono font-black ${color}`}>{score}</span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION PANEL WRAPPER
   ═══════════════════════════════════════════════════════════════ */
function SectionPanel({ title, subtitle, icon, children, accent = "blue" }: {
  title: string; subtitle: string; icon: ReactNode; children: ReactNode; accent?: string;
}) {
  const accentColors: Record<string, string> = {
    blue: "from-blue-200/20 to-blue-300/5 border-blue-200/10 text-blue-200",
    rose: "from-rose-400/15 to-rose-500/5 border-rose-400/10 text-rose-400",
    emerald: "from-emerald-400/15 to-emerald-500/5 border-emerald-400/10 text-emerald-400",
    amber: "from-amber-400/15 to-amber-500/5 border-amber-400/10 text-amber-400",
  };
  const ac = accentColors[accent] || accentColors.blue;
  return (
    <div className="animate-page-enter">
      <div className="bg-slate-950/40 backdrop-blur-xl border border-white/[0.05] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ac} border flex items-center justify-center`}>{icon}</div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-[10px] text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BUILD DATA HELPERS
   ═══════════════════════════════════════════════════════════════ */
type Sev = "info" | "warning" | "critical" | "success";

const SEV_STYLE: Record<Sev, { border: string; accentBar: string; iconBg: string; iconColor: string; labelColor: string }> = {
  info:     { border:"border-blue-200/[0.08]", accentBar:"bg-blue-300", iconBg:"bg-blue-200/[0.06]", iconColor:"text-blue-200/60", labelColor:"text-blue-200/50" },
  warning:  { border:"border-amber-400/[0.08]", accentBar:"bg-amber-400", iconBg:"bg-amber-400/[0.06]", iconColor:"text-amber-400/60", labelColor:"text-amber-400/50" },
  critical: { border:"border-rose-400/[0.08]", accentBar:"bg-rose-400", iconBg:"bg-rose-400/[0.06]", iconColor:"text-rose-400/60", labelColor:"text-rose-400/50" },
  success:  { border:"border-emerald-400/[0.08]", accentBar:"bg-emerald-400", iconBg:"bg-emerald-400/[0.06]", iconColor:"text-emerald-400/60", labelColor:"text-emerald-400/50" },
};

function buildDataCards(spec: VehicleSpec) {
  return [
    { label:"Transponder Core",    value:spec.transponderCore,       icon:<Cpu size={12} />,           severity:"info" as Sev },
    { label:"Key System",          value:spec.keySystem,             icon:<KeyRound size={12} />,      severity:"info" as Sev },
    { label:"LF Wake-Up",          value:spec.lfWakeUp,              icon:<Radio size={12} />,         severity:"info" as Sev },
    { label:"UHF Carrier",         value:spec.uhfCarrier,            icon:<Wifi size={12} />,          severity:"warning" as Sev },
    { label:"UWB Status",          value:spec.uwbStatus,             icon:<Fingerprint size={12} />,   severity: spec.uwbStatus.toLowerCase().includes("available") ? "success" as Sev : "critical" as Sev },
    { label:"Crypto Standard",     value:spec.cryptoStandard,        icon:<Lock size={12} />,          severity:"info" as Sev },
    { label:"CAN Topology",        value:spec.canTopology,           icon:<CircuitBoard size={12} />,  severity:"warning" as Sev },
    { label:"Baud Rate",           value:spec.baudRate,              icon:<Gauge size={12} />,         severity:"info" as Sev },
    { label:"Telematics",          value:spec.telematicsProtocol,    icon:<Server size={12} />,        severity:"info" as Sev },
    { label:"Primary Vulnerability", value:spec.primaryVulnerability, icon:<AlertTriangle size={12} />, severity:"critical" as Sev },
    { label:"Physical Access Point", value:spec.physicalAccessPoint,  icon:<Crosshair size={12} />,    severity:"critical" as Sev },
    { label:"Required Mitigation",   value:spec.requiredMitigation,  icon:<ShieldCheck size={12} />,   severity:"success" as Sev },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [appState, setAppState] = useState<"idle" | "loading" | "results">("idle");
  const [activeTab, setActiveTab] = useState<TabId>("status");

  const makes = useMemo(() => Object.keys(vehicleDatabase).sort(), []);
  const models = useMemo(() => (make ? Object.keys(vehicleDatabase[make]?.models || {}).sort() : []), [make]);
  const years = useMemo(() => {
    if (!make || !model) return [];
    return vehicleDatabase[make]?.models[model]?.years || [];
  }, [make, model]);

  const spec = useMemo(() => {
    if (!make || !model || !year) return null;
    return vehicleDatabase[make]?.models[model]?.spec || null;
  }, [make, model, year]);

  const threat = useMemo(() => spec ? calcThreatLevel(spec) : null, [spec]);
  const threatTheme = threat ? THREAT_THEME[threat.level] : null;

  useEffect(() => { setModel(""); setYear(""); }, [make]);
  useEffect(() => { setYear(""); }, [model]);

  function handleRun() {
    if (!make || !model || !year) return;
    setAppState("loading");
    setTimeout(() => { setAppState("results"); setActiveTab("status"); }, 2200);
  }
  function handleReset() {
    setAppState("idle"); setMake(""); setModel(""); setYear("");
  }

  /* ── Derived analysis data ── */
  const rfBands = useMemo(() => {
    if (!spec) return [];
    const hasUHF = !spec.uhfCarrier.includes("N/A");
    const hasLF = !spec.lfWakeUp.includes("N/A");
    const hasUWB = spec.uwbStatus.toLowerCase().includes("available");
    const hasBLE = spec.lfWakeUp.includes("BLE") || spec.uhfCarrier.includes("BLE") || spec.keySystem.toLowerCase().includes("phone");
    return [
      { label:"LF Channel",  freq: hasLF ? "125 kHz" : "N/A", status: hasLF ? "Active — Passive polling" : "Not implemented", range: hasLF ? "1–2m effective" : "—", risk: hasLF ? 65 : 0, color:"from-amber-500 to-orange-400" },
      { label:"UHF Channel", freq: hasUHF ? "433.92 MHz" : "N/A", status: hasUHF ? "Active — Carrier detected" : "BLE-based system", range: hasUHF ? "30–100m (amplified)" : "—", risk: hasUHF ? 78 : 0, color:"from-rose-500 to-red-400" },
      { label:"UWB Ranging",  freq: hasUWB ? "6.5–8 GHz" : "N/A", status: hasUWB ? "Active — Distance-bounding" : "Not implemented", range: hasUWB ? "10m precision" : "—", risk: hasUWB ? 15 : 0, color:"from-emerald-500 to-teal-400" },
      { label:"BLE Channel", freq: hasBLE ? "2.4 GHz" : "N/A", status: hasBLE ? "Active — Phone key / Digital key" : "Not detected", range: hasBLE ? "10–15m" : "—", risk: hasBLE ? 55 : 0, color:"from-sky-500 to-blue-400" },
    ];
  }, [spec]);

  const networkItems = useMemo(() => {
    if (!spec) return [];
    const hasGw = spec.canTopology.toLowerCase().includes("gateway") || spec.canTopology.toLowerCase().includes("zgw");
    const hasEth = spec.canTopology.toLowerCase().includes("ethernet");
    const hasSecOC = spec.uwbStatus.toLowerCase().includes("full uwb");
    return [
      { label:"Gateway ECU Auth", value: hasGw ? "Present — Central routing module" : "Absent or bypassable — Direct CAN access", status: hasGw ? "secure" : "critical" },
      { label:"SecOC Implementation", value: hasSecOC ? "Partial — MAC on critical frames" : "Absent — No message authentication", status: hasSecOC ? "warning" : "critical" },
      { label:"Network Isolation", value: hasEth ? "Zonal architecture with domain isolation" : "Flat bus topology — Limited isolation", status: hasEth ? "secure" : "warning" },
      { label:"Exposed Bus Nodes", value: spec.physicalAccessPoint, status: "critical" },
      { label:"Protocol Speed", value: spec.baudRate, status: "warning" },
      { label:"Telematics Module", value: spec.telematicsProtocol, status: "warning" },
    ];
  }, [spec]);

  const threats = useMemo(() => {
    if (!spec) return [];
    const v = spec.primaryVulnerability.toLowerCase();
    const hasUWB = spec.uwbStatus.toLowerCase().includes("available");
    return [
      { label:"RF Relay Attack",  risk: hasUWB ? 20 : (v.includes("relay") ? 82 : 65), method:"Dual-transceiver extension", time:"< 30 seconds", equipment:"£100–£500" },
      { label:"CAN-Bus Injection", risk: v.includes("can") ? 88 : 25, method:"Headlamp/bumper CAN tap", time:"< 60 seconds", equipment:"£2,000–£5,000" },
      { label:"OBD Key Cloning",   risk: v.includes("obd") ? 75 : 30, method:"Diagnostic session exploit", time:"2–5 minutes", equipment:"£3,000–£10,000" },
      { label:"BLE/Phone Relay",   risk: v.includes("ble") ? 70 : (hasUWB ? 12 : 35), method:"BLE range amplification", time:"< 45 seconds", equipment:"£200–£1,000" },
      { label:"Signal Jamming",    risk: 45, method:"Wideband RF jamming", time:"Continuous", equipment:"£50–£200" },
    ];
  }, [spec]);
  const overallRisk = threat?.score || 0;

  const mitigations = useMemo(() => {
    if (!spec) return [];
    const items = [
      { tier:"CRITICAL" as const, action:"Deploy rigid Faraday attenuation enclosure (>90 dB) for key fob storage. Continuous aluminum construction with conductive gasket seal.", effectiveness:95, difficulty:"Low" },
      { tier:"CRITICAL" as const, action:"Install CAN-bus intrusion detection system (IDS) on body electronics harness. Monitor for anomalous frame injection patterns.", effectiveness:85, difficulty:"High" },
      { tier:"HIGH" as const, action:"Implement OBD port lockdown — physical disconnect switch or encrypted diagnostic gateway device.", effectiveness:80, difficulty:"Medium" },
      { tier:"HIGH" as const, action:"Enable manufacturer software-based immobilizer features: PIN-to-Drive, motion-sensor key sleep, dealer-configurable timeout.", effectiveness:70, difficulty:"Low" },
      { tier:"RECOMMENDED" as const, action:"Install secondary aftermarket immobilizer with independent RF-isolated circuit. Ghost or StarLine category.", effectiveness:75, difficulty:"High" },
      { tier:"RECOMMENDED" as const, action:"Configure geofenced telematics alerts for unauthorized ignition-on or motion events via OEM app.", effectiveness:50, difficulty:"Low" },
      { tier:"ADVISORY" as const, action:"Physical steering wheel lock as visible deterrent. Not effective against electronic vectors but increases perceived risk.", effectiveness:30, difficulty:"Low" },
    ];
    return items;
  }, [spec]);

  /* ── Particles ── */
  const particles = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 1,
    duration: `${Math.random() * 20 + 15}s`,
    delay: `${Math.random() * 15}s`,
    opacity: Math.random() * 0.3 + 0.1,
    driftX: `${(Math.random() - 0.5) * 60}px`,
    driftX2: `${(Math.random() - 0.5) * 80}px`,
  })), []);

  const lightStreams = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i,
    top: `${12 + i * 12}%`,
    width: `${Math.random() * 250 + 150}px`,
    height: `${Math.random() * 1 + 0.5}px`,
    duration: `${Math.random() * 12 + 8}s`,
    delay: `${Math.random() * 10}s`,
    direction: i % 2 === 0 ? "right" : "left",
    opacity: Math.random() * 0.3 + 0.1,
  })), []);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ═══ BACKGROUND ═══ */}
      <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden" style={{ background: "linear-gradient(145deg, #030712 0%, #0A1628 40%, #060E1A 70%, #020617 100%)" }}>
        {/* Grid */}
        <div className="absolute inset-0 animate-grid-pulse" style={{ backgroundImage:"radial-gradient(circle, rgba(148,190,230,0.04) 1px, transparent 1px)", backgroundSize:"50px 50px" }} />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full animate-pulse-glow" style={{ background:"radial-gradient(circle, rgba(56,140,220,0.12), transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full animate-pulse-glow-alt" style={{ background:"radial-gradient(circle, rgba(100,130,200,0.08), transparent 70%)" }} />
        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} className="absolute bottom-0 rounded-full animate-float-up"
            style={{ left:p.left, width:`${p.size}px`, height:`${p.size}px`, background:`rgba(148,190,230,${p.opacity + 0.2})`, boxShadow:`0 0 ${p.size * 4}px rgba(148,190,230,${p.opacity})`, "--float-duration":p.duration, "--float-delay":p.delay, "--particle-opacity":String(p.opacity), "--drift-x":p.driftX, "--drift-x2":p.driftX2 } as React.CSSProperties} />
        ))}
        {/* Light streams */}
        {lightStreams.map(ls => (
          <div key={ls.id} className={`absolute ${ls.direction === "right" ? "animate-flow-right" : "animate-flow-left"}`}
            style={{ top:ls.top, width:ls.width, height:ls.height, background:`linear-gradient(90deg, transparent, rgba(148,190,230,${ls.opacity}), transparent)`, "--flow-dur":ls.duration, "--flow-delay":ls.delay } as React.CSSProperties} />
        ))}
        {/* Hexagons */}
        <svg className="absolute top-[15%] right-[10%] w-28 h-28 animate-float-hex text-blue-200/[0.05]" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        <svg className="absolute bottom-[20%] left-[8%] w-20 h-20 animate-float-hex-2 text-blue-200/[0.04]" viewBox="0 0 100 100"><polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        {/* Orbital rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-blue-200/[0.03] animate-orbital" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border border-dashed border-blue-200/[0.02] animate-orbital-reverse" />
        {/* Giant rotating key */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-key-wobble-spin" style={{ filter: "drop-shadow(0 0 30px rgba(148,190,230,0.06))" }}>
            <svg viewBox="0 0 300 500" className="w-[550px] h-[550px] text-blue-200/[0.04]" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="85" y="20" width="130" height="220" rx="20" />
              <circle cx="150" cy="90" r="22" strokeWidth="0.5" />
              <rect x="135" y="80" width="30" height="20" rx="4" />
              <circle cx="120" cy="150" r="12" /><circle cx="180" cy="150" r="12" />
              <rect x="138" y="185" width="24" height="14" rx="3" />
              <rect x="110" y="125" width="80" height="1" strokeWidth="0.3" opacity="0.5" />
              <rect x="110" y="175" width="80" height="1" strokeWidth="0.3" opacity="0.5" />
              <rect x="130" y="60" width="40" height="18" rx="3" strokeWidth="0.4" strokeDasharray="2,2" />
              <line x1="135" y1="65" x2="145" y2="65" strokeWidth="0.3" /><line x1="155" y1="65" x2="165" y2="65" strokeWidth="0.3" />
              <line x1="140" y1="70" x2="160" y2="70" strokeWidth="0.3" /><line x1="140" y1="73" x2="155" y2="73" strokeWidth="0.3" />
              <path d="M148,240 L148,410" strokeWidth="1.2" />
              <path d="M152,240 L152,410" strokeWidth="1.2" />
              <path d="M152,300 L170,300 L170,320 L152,320" />
              <path d="M152,340 L165,340 L165,355 L152,355" />
              <path d="M152,370 L175,370 L175,390 L152,390" />
              <circle cx="150" cy="15" r="10" strokeWidth="0.8" />
              <path d="M75,90 Q55,90 50,110" strokeWidth="0.3" strokeDasharray="3,3" opacity="0.5" />
              <path d="M65,90 Q45,95 40,120" strokeWidth="0.3" strokeDasharray="3,3" opacity="0.4" />
              <path d="M55,95 Q35,105 30,130" strokeWidth="0.3" strokeDasharray="3,3" opacity="0.3" />
            </svg>
          </div>
          {/* Scan line */}
          <div className="absolute left-0 right-0 h-[1.5px] animate-scan-sweep" style={{ background:"linear-gradient(90deg, transparent, rgba(148,190,230,0.25), transparent)", boxShadow:"0 0 20px rgba(148,190,230,0.15)" }} />
        </div>
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse at center, transparent 40%, rgba(3,7,18,0.7) 100%)" }} />
      </div>

      {/* ═══ FOREGROUND ═══ */}
      <div className="relative z-10 min-h-screen flex flex-col items-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-5xl space-y-4">

          {/* ═══ HEADER CARD ═══ */}
          <div className="bg-slate-950/50 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            {/* Corner accents */}
            <div className="relative">
              {["-top-3 -left-3","  -top-3 -right-3 rotate-90","-bottom-3 -right-3 rotate-180","-bottom-3 -left-3 -rotate-90"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 animate-corner-pulse`} style={{ animationDelay: `${i * 0.5}s` }}>
                  <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-blue-200/30 to-transparent" />
                  <div className="absolute top-0 left-0 h-full w-[1.5px] bg-gradient-to-b from-blue-200/30 to-transparent" />
                </div>
              ))}
            </div>

            {/* Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-200/10 to-blue-300/5 border border-blue-200/10 flex items-center justify-center shadow-[0_0_20px_rgba(148,190,230,0.06)]">
                <ShieldCheck size={22} className="text-blue-200" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight animate-neon-text">Vehicle Integrity & Hardware Diagnostics</h1>
                <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">Passive OEM Telemetry & Vulnerability Scanner — Forensic Intelligence Suite v5.0</p>
              </div>
            </div>

            {/* ═══ IDLE: Input form ═══ */}
            {appState === "idle" && (
              <div className="animate-fade-in-up">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { label:"Manufacturer", value:make, setter:setMake, options:makes, icon:<Car size={13} /> },
                    { label:"Model",        value:model, setter:setModel, options:models, icon:<Cpu size={13} /> },
                    { label:"Year",         value:year,  setter:setYear, options:years,  icon:<Clock size={13} /> },
                  ].map(({ label, value, setter, options, icon }) => (
                    <div key={label} className="relative group">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-1.5 pl-1">{label}</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-200/60 transition-colors">{icon}</div>
                        <select value={value} onChange={e => setter(e.target.value)} disabled={options.length === 0}
                          className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-blue-200/15 text-slate-300 text-sm font-medium rounded-xl pl-9 pr-9 py-3 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-blue-200/20 focus:border-blue-200/20 disabled:opacity-30 cursor-pointer hover:shadow-[0_0_15px_rgba(148,190,230,0.04)]">
                          <option value="">Select {label}</option>
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>

                {make && model && year && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-200/[0.04] border border-blue-200/10 rounded-xl mb-4 animate-fade-in">
                    <ScanLine size={13} className="text-blue-200/50" />
                    <span className="text-[10px] font-mono font-semibold text-blue-200/60">{year} {make} {model}</span>
                    <span className="text-[10px] text-slate-600 ml-auto">Target acquired</span>
                  </div>
                )}

                <button onClick={handleRun} disabled={!make || !model || !year}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-200/15 to-blue-300/10 hover:from-blue-200/25 hover:to-blue-300/15 border border-blue-200/15 hover:border-blue-200/30 text-blue-100 font-bold text-sm rounded-xl px-6 py-3.5 transition-all duration-300 disabled:opacity-20 disabled:pointer-events-none shadow-[0_0_20px_rgba(148,190,230,0.04)] hover:shadow-[0_0_30px_rgba(148,190,230,0.1)]">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Radar size={16} />Run Passive Audit
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            )}

            {/* ═══ LOADING ═══ */}
            {appState === "loading" && (
              <div className="flex flex-col items-center gap-5 py-12 animate-fade-in">
                <div className="relative">
                  <div className="absolute -inset-5 rounded-full border-2 border-blue-200/15 animate-pulse-ring" />
                  <div className="w-[68px] h-[68px] rounded-full bg-blue-200/[0.06] border border-blue-200/15 flex items-center justify-center">
                    <Loader2 size={28} className="text-blue-200 animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-300">Querying OEM Database<span className="animate-dot-pulse">...</span></p>
                  <p className="text-xs text-slate-500 mt-1.5"><span className="font-mono text-blue-200/70">{year} {make} {model}</span></p>
                </div>
                <div className="w-64 h-1 bg-white/[0.03] rounded-full overflow-hidden">
                  <div className="h-full rounded-full animate-shimmer-width" style={{ background:"linear-gradient(90deg, transparent, rgba(148,190,230,0.5), rgba(200,220,245,0.7), rgba(148,190,230,0.5), transparent)" }} />
                </div>
                <div className="flex gap-5 mt-1">
                  {["LF 125kHz","UHF 433MHz","CAN-FD","AES-128"].map((l,i) => (
                    <span key={l} className="text-[9px] font-mono text-blue-200/40 font-semibold tracking-wider uppercase"
                      style={{ animation:`fadeIn 0.5s ease-out ${0.3+i*0.3}s forwards`, opacity:0 }}>{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ RESULTS: Tab bar ═══ */}
            {appState === "results" && (
              <div className="animate-fade-in">
                {/* Vehicle chip */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-blue-200/50" />
                    <span className="text-sm font-bold text-white">{year} {make} {model}</span>
                  </div>
                  <button onClick={handleReset} className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-blue-200/[0.05] border border-white/[0.06] hover:border-blue-200/15 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-blue-200 transition-all">
                    <RotateCcw size={11} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
                    New Audit
                  </button>
                </div>

                {/* Tab navigation */}
                <div className="flex gap-1 overflow-x-auto pb-1 mb-1 -mx-2 px-2">
                  {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wide transition-all duration-300 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-blue-200/[0.08] text-blue-200 border border-blue-200/15"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent"
                      }`}>
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              TAB CONTENT PAGES
              ═══════════════════════════════════════════════════════ */}
          {appState === "results" && spec && threat && threatTheme && (
            <div key={activeTab} className="space-y-4 animate-page-enter">

              {/* ─────────────────────────────────────────────
                  TAB 1: SECURITY STATUS
                  ───────────────────────────────────────────── */}
              {activeTab === "status" && (
                <>
                  {/* ★★★ MASSIVE THREAT STATUS BANNER ★★★ */}
                  <div className={`${threatTheme.bg} ${threatTheme.glow} border-2 ${threatTheme.border} backdrop-blur-2xl rounded-2xl p-6 sm:p-8`}>
                    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                      {/* Gauge */}
                      <ThreatGauge score={threat.score} color={threatTheme.gaugeColor} />

                      {/* Center text */}
                      <div className="flex-1 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                          <span className={threatTheme.text}>{threatTheme.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${threatTheme.text}`}>{threat.level}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md ${threatTheme.bg} border ${threatTheme.border} ${threatTheme.text}`}>
                                THREAT LEVEL
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Composite Security Assessment</p>
                          </div>
                        </div>
                        <p className="text-[12px] sm:text-[13px] text-slate-400 leading-relaxed max-w-xl">{threat.summary}</p>

                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-3 mt-4 justify-center lg:justify-start">
                          {[
                            { label:"Primary Vector", value: spec.primaryVulnerability.split("—")[0].split("via")[0].trim(), icon:<Bug size={11} /> },
                            { label:"Access Time", value: threat.score >= 75 ? "< 60s" : threat.score >= 55 ? "2–5 min" : "5+ min", icon:<Timer size={11} /> },
                            { label:"UWB Defense", value: spec.uwbStatus.includes("Available") ? "Active" : "None", icon:<Fingerprint size={11} /> },
                          ].map(stat => (
                            <div key={stat.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                              <span className="text-slate-500">{stat.icon}</span>
                              <div>
                                <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">{stat.label}</div>
                                <div className="text-[10px] font-mono font-bold text-slate-300">{stat.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: vulnerability callout */}
                      <div className="w-full lg:w-56 flex-shrink-0">
                        <div className={`${threatTheme.bg} border ${threatTheme.border} rounded-xl p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Crosshair size={12} className={threatTheme.text} />
                            <span className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${threatTheme.text}`}>Primary Exploit</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300 leading-relaxed mb-3">{spec.primaryVulnerability}</p>
                          <div className="h-[1px] bg-white/[0.05] mb-3" />
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={12} className={threatTheme.text} />
                            <span className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${threatTheme.text}`}>Access Point</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300 leading-relaxed">{spec.physicalAccessPoint}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ★★★ REQUIRED MITIGATION — Full width */}
                  <div className="bg-emerald-400/[0.03] backdrop-blur-xl border border-emerald-400/15 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/15 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck size={20} className="text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-emerald-400">Required Mitigation</h3>
                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/15">MANDATORY</span>
                        </div>
                        <p className="text-[12px] font-mono text-slate-300 leading-relaxed">{spec.requiredMitigation}</p>
                      </div>
                    </div>
                  </div>

                  {/* ★★★ BUY FARADAY BOX — Shows only when vulnerable ★★★ */}
                  {threat && (threat.level === "CRITICAL" || threat.level === "HIGH" || threat.level === "MODERATE") && (
                    <div className="animate-section-reveal section-delay-2">
                      <div className="relative overflow-hidden rounded-2xl border-2 border-sky-500/20 animate-buy-glow bg-gradient-to-br from-sky-950/40 via-slate-950/60 to-blue-950/40 backdrop-blur-2xl">
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute inset-0 animate-buy-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent w-1/2 h-full" />
                        </div>
                        {/* Danger strip top */}
                        <div className={`h-1 w-full bg-gradient-to-r ${threat.level === "CRITICAL" ? "from-red-600 via-red-500 to-orange-500" : threat.level === "HIGH" ? "from-amber-600 via-amber-500 to-yellow-500" : "from-sky-600 via-sky-500 to-cyan-400"}`} />
                        
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col lg:flex-row items-center gap-6">
                            {/* Left — Alert icon + text */}
                            <div className="flex-1 text-center lg:text-left">
                              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center animate-icon-bounce ${threat.level === "CRITICAL" ? "bg-red-500/10 border border-red-500/20" : threat.level === "HIGH" ? "bg-amber-500/10 border border-amber-500/20" : "bg-sky-500/10 border border-sky-500/20"}`}>
                                  <ShieldOff size={24} className={threat.level === "CRITICAL" ? "text-red-400" : threat.level === "HIGH" ? "text-amber-400" : "text-sky-400"} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded ${threat.level === "CRITICAL" ? "bg-red-500/15 text-red-400 border border-red-500/20" : threat.level === "HIGH" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-sky-500/15 text-sky-400 border border-sky-500/20"}`}>
                                      {threat.level} VULNERABILITY DETECTED
                                    </span>
                                  </div>
                                  <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
                                    RF Signal Protection Required
                                  </h3>
                                </div>
                              </div>
                              
                              <p className="text-[12px] text-slate-400 leading-relaxed max-w-xl mb-4">
                                Your <span className="text-white font-semibold">{year} {make} {model}</span> key fob transmits on <span className="font-mono text-sky-300/80">433.92 MHz</span> and is susceptible to relay signal extension attacks. 
                                A <span className="text-white font-semibold">Rigid Faraday Attenuation Box</span> provides <span className="font-mono text-emerald-400/80">{">"}90 dB</span> signal 
                                isolation — mathematically eliminating relay theft vectors when the key is stored inside.
                              </p>

                              {/* Feature pills */}
                              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                                {[
                                  { icon: <Box size={11} />, text: "Rigid Aluminum Construction" },
                                  { icon: <Zap size={11} />, text: ">90 dB Attenuation" },
                                  { icon: <Lock size={11} />, text: "Zero RF Leakage" },
                                  { icon: <Star size={11} />, text: "Military-Grade Shielding" },
                                ].map(f => (
                                  <span key={f.text} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1">
                                    <span className="text-sky-400/70">{f.icon}</span>
                                    {f.text}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Right — CTA Button */}
                            <div className="flex flex-col items-center gap-3 shrink-0">
                              <a
href="https://amzn.to/4rsnwWe"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all duration-300 active:scale-[0.97] shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:shadow-xl"
                              >
                                {/* Button shimmer */}
                                <div className="absolute inset-0 overflow-hidden">
                                  <div className="absolute inset-0 animate-buy-shimmer bg-gradient-to-r from-transparent via-white/[0.12] to-transparent w-1/3 h-full" />
                                </div>
                                <ShoppingCart size={18} className="relative z-10 group-hover:scale-110 transition-transform" />
                                <span className="relative z-10 tracking-wide">Get Faraday Protection</span>
                                <ExternalLink size={14} className="relative z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </a>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <ShoppingCart size={10} />
                                Available on Amazon.com — Ships worldwide
                              </span>
                              <span className="text-[11px] text-slate-500 mt-1 block">
                                As an Amazon Associate, I earn from qualifying purchases.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ★★★ SPEC GRID — Varied sizes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {buildDataCards(spec).map((c, i) => {
                      const st = SEV_STYLE[c.severity];
                      // Make some cards span 2 columns
                      const spanClass = (i === 9 || i === 10) ? "sm:col-span-2 lg:col-span-1" : "";
                      return (
                        <div key={c.label} className={`card-hover-lift relative bg-white/[0.02] backdrop-blur-sm border ${st.border} rounded-xl p-4 animate-slide-up opacity-0 ${spanClass}`}
                          style={{ animationFillMode:"forwards", animationDelay:`${i*0.05}s` }}>
                          <div className={`absolute left-0 top-3 bottom-3 w-[2.5px] rounded-full ${st.accentBar} opacity-25`} />
                          <div className="flex items-center gap-2 mb-2 pl-2.5">
                            <div className={`w-7 h-7 rounded-lg ${st.iconBg} flex items-center justify-center ${st.iconColor}`}>{c.icon}</div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.08em] ${st.labelColor}`}>{c.label}</span>
                          </div>
                          <p className="text-[11.5px] font-mono font-medium text-slate-300 leading-relaxed pl-[2.6rem]">{c.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ─────────────────────────────────────────────
                  TAB 2: RF SIGNAL INTELLIGENCE
                  ───────────────────────────────────────────── */}
              {activeTab === "signal" && (
                <SectionPanel title="RF Signal Architecture" subtitle="Electromagnetic frequency band analysis & exposure assessment" icon={<Antenna size={16} />} accent="amber">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {rfBands.map(band => (
                      <div key={band.label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Signal size={13} className="text-blue-200/50" />
                            <span className="text-[11px] font-bold text-slate-300">{band.label}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-blue-200/80">{band.freq}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-[10px] text-slate-500">{band.status}</span>
                          <span className="text-[9px] text-slate-600 ml-auto">{band.range}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${band.color} animate-risk-bar`}
                            style={{ "--risk-width":`${band.risk}%` } as React.CSSProperties} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-slate-600">Exposure</span>
                          <span className={`text-[9px] font-bold ${band.risk > 70 ? "text-rose-400" : band.risk > 40 ? "text-amber-400" : band.risk > 0 ? "text-emerald-400" : "text-slate-600"}`}>{band.risk > 0 ? `${band.risk}%` : "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Signal characteristics — full width big card */}
                  <div className="bg-white/[0.02] border border-blue-200/[0.08] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Waypoints size={14} className="text-blue-200/50" />
                      <span className="text-[11px] font-bold text-slate-300">Signal Characteristics Summary</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label:"Modulation", value: spec.uhfCarrier.includes("OOK") ? "OOK (On-Off Keying)" : spec.uhfCarrier.includes("FSK") ? "FSK (Freq Shift)" : spec.uhfCarrier.includes("BLE") ? "GFSK (BLE)" : "ASK/OOK Standard", icon:<Activity size={12} /> },
                        { label:"Encoding", value: spec.baudRate.includes("Manchester") ? "Manchester" : "NRZ-L Standard", icon:<Binary size={12} /> },
                        { label:"Rolling Code", value: spec.uhfCarrier.includes("Rolling") ? "Active" : spec.cryptoStandard.includes("rolling") ? "Active" : "Static/Challenge", icon:<Hash size={12} /> },
                        { label:"Carrier Detect", value: spec.uhfCarrier.includes("N/A") ? "BLE Channel" : "Constant Carrier", icon:<Radio size={12} /> },
                      ].map(item => (
                        <div key={item.label} className="text-center">
                          <div className="flex justify-center mb-2"><span className="text-blue-200/40">{item.icon}</span></div>
                          <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold mb-1">{item.label}</div>
                          <div className="text-[10px] font-mono font-bold text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionPanel>
              )}

              {/* ─────────────────────────────────────────────
                  TAB 3: NETWORK & CRYPTO
                  ───────────────────────────────────────────── */}
              {activeTab === "network" && (
                <>
                  <SectionPanel title="CAN / Network Security Assessment" subtitle="Bus architecture integrity & isolation analysis" icon={<Network size={16} />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {networkItems.map(item => (
                        <div key={item.label} className={`bg-white/[0.02] border rounded-xl p-3.5 ${item.status === "secure" ? "border-emerald-400/10" : item.status === "warning" ? "border-amber-400/10" : "border-rose-400/10"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {item.status === "secure" ? <CheckCircle2 size={13} className="text-emerald-400/70" /> : item.status === "warning" ? <Eye size={13} className="text-amber-400/70" /> : <XCircle size={13} className="text-rose-400/70" />}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.06em]">{item.label}</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300 leading-relaxed pl-5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </SectionPanel>

                  <SectionPanel title="Cryptographic Integrity Profile" subtitle="Encryption algorithm analysis & key management assessment" icon={<Binary size={16} />} accent="amber">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { label:"Cipher Suite", value:spec.cryptoStandard, icon:<Lock size={13} />, status: spec.cryptoStandard.includes("256") ? "secure" : "warning" },
                        { label:"Key Derivation", value: spec.cryptoStandard.includes("proprietary") ? "OEM Proprietary Seed + Rolling Challenge" : "Standard AES Symmetric Key Exchange", icon:<KeyRound size={13} />, status:"warning" },
                        { label:"Forward Secrecy", value: spec.uwbStatus.toLowerCase().includes("uwb") ? "Partial — UWB session keys rotate" : "Absent — Static symmetric key pairs", icon:<ShieldOff size={13} />, status: spec.uwbStatus.toLowerCase().includes("uwb") ? "warning" : "critical" },
                        { label:"Known CVE References", value:"No specific CVE — Generic vector class identified", icon:<Globe size={13} />, status:"warning" },
                        { label:"Challenge-Response Latency", value:"< 50ms nominal (LF/UHF handshake)", icon:<Timer size={13} />, status:"warning" },
                        { label:"Replay Protection", value: spec.uhfCarrier.includes("Rolling") ? "Rolling code — Limited replay window" : "Fixed carrier — Potentially replayable", icon:<Cable size={13} />, status: spec.uhfCarrier.includes("Rolling") ? "warning" : "critical" },
                      ].map(item => (
                        <div key={item.label} className={`bg-white/[0.02] border rounded-xl p-3.5 ${item.status === "secure" ? "border-emerald-400/10" : item.status === "warning" ? "border-amber-400/10" : "border-rose-400/10"}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={item.status === "secure" ? "text-emerald-400/60" : item.status === "warning" ? "text-amber-400/60" : "text-rose-400/60"}>{item.icon}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.06em]">{item.label}</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-300 leading-relaxed pl-5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </SectionPanel>
                </>
              )}

              {/* ─────────────────────────────────────────────
                  TAB 4: THREAT MATRIX
                  ───────────────────────────────────────────── */}
              {activeTab === "threats" && (
                <>
                  <SectionPanel title="Attack Surface Threat Matrix" subtitle="Quantified risk assessment per attack vector" icon={<Target size={16} />} accent="rose">
                    <div className="space-y-3 mb-5">
                      {threats.map(t => (
                        <div key={t.label} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Crosshair size={12} className={t.risk > 60 ? "text-rose-400/70" : t.risk > 30 ? "text-amber-400/70" : "text-emerald-400/70"} />
                              <span className="text-[11px] font-bold text-slate-300">{t.label}</span>
                            </div>
                            <span className={`text-[11px] font-mono font-bold ${t.risk > 70 ? "text-rose-400" : t.risk > 40 ? "text-amber-400" : "text-emerald-400"}`}>{t.risk}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2.5">
                            <div className={`h-full rounded-full animate-risk-bar ${t.risk > 70 ? "bg-gradient-to-r from-rose-500 to-red-400" : t.risk > 40 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                              style={{ "--risk-width":`${t.risk}%` } as React.CSSProperties} />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div><span className="text-[8px] text-slate-600 uppercase tracking-wider block">Method</span><span className="text-[10px] font-mono text-slate-400">{t.method}</span></div>
                            <div><span className="text-[8px] text-slate-600 uppercase tracking-wider block">Time</span><span className="text-[10px] font-mono text-slate-400">{t.time}</span></div>
                            <div><span className="text-[8px] text-slate-600 uppercase tracking-wider block">Equipment</span><span className="text-[10px] font-mono text-slate-400">{t.equipment}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Overall threat */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${overallRisk > 55 ? "bg-rose-400/[0.04] border-rose-400/15" : overallRisk > 35 ? "bg-amber-400/[0.04] border-amber-400/15" : "bg-emerald-400/[0.04] border-emerald-400/15"}`}>
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert size={16} className={overallRisk > 55 ? "text-rose-400" : overallRisk > 35 ? "text-amber-400" : "text-emerald-400"} />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">Composite Threat Level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-mono font-extrabold ${overallRisk > 55 ? "text-rose-400" : overallRisk > 35 ? "text-amber-400" : "text-emerald-400"}`}>{overallRisk}%</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${overallRisk > 55 ? "bg-rose-400/15 text-rose-400" : overallRisk > 35 ? "bg-amber-400/15 text-amber-400" : "bg-emerald-400/15 text-emerald-400"}`}>
                          {threat.level}
                        </span>
                      </div>
                    </div>
                  </SectionPanel>

                  <SectionPanel title="Countermeasure Blueprint" subtitle="Tiered mitigation strategy & effectiveness analysis" icon={<Layers size={16} />} accent="emerald">
                    <div className="space-y-2.5">
                      {mitigations.map((m, i) => {
                        const tc = m.tier === "CRITICAL" ? { bg:"bg-rose-400/8", border:"border-rose-400/15", text:"text-rose-400", bar:"from-rose-500 to-red-400" }
                          : m.tier === "HIGH" ? { bg:"bg-amber-400/8", border:"border-amber-400/15", text:"text-amber-400", bar:"from-amber-500 to-orange-400" }
                          : m.tier === "RECOMMENDED" ? { bg:"bg-blue-300/6", border:"border-blue-300/12", text:"text-blue-300", bar:"from-blue-400 to-cyan-400" }
                          : { bg:"bg-slate-400/5", border:"border-slate-400/10", text:"text-slate-400", bar:"from-slate-400 to-slate-500" };
                        return (
                          <div key={i} className={`${tc.bg} border ${tc.border} rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-extrabold ${tc.text} uppercase tracking-[0.1em] px-2 py-0.5 rounded-md bg-white/[0.03]`}>{m.tier}</span>
                                <span className="text-[9px] text-slate-600 uppercase tracking-wider">{m.difficulty} Difficulty</span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold ${tc.text}`}>{m.effectiveness}% eff.</span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-2">{m.action}</p>
                            <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${tc.bar} animate-risk-bar`}
                                style={{ "--risk-width":`${m.effectiveness}%` } as React.CSSProperties} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionPanel>

                  {/* ★ Compact Buy CTA in Threats Tab */}
                  {threat && (threat.level === "CRITICAL" || threat.level === "HIGH" || threat.level === "MODERATE") && (
                    <div className="animate-section-reveal section-delay-4">
                      <a href="https://amzn.to/4rsnwWe" target="_blank" rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-5 bg-gradient-to-r from-sky-950/30 via-slate-950/40 to-blue-950/30 border border-sky-500/15 hover:border-sky-500/30 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 active:scale-[0.99]">
                        <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center shrink-0 group-hover:bg-sky-500/15 transition-colors">
                          <ShoppingCart size={20} className="text-sky-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-[13px] font-bold text-white">Procure Rigid Faraday Attenuation Box</h4>
                            <ExternalLink size={12} className="text-sky-400/50 shrink-0" />
                          </div>
                          <p className="text-[10px] text-slate-400">Deploy {">"}90 dB signal isolation to neutralize relay attack vectors. Available on Amazon with global shipping.</p>
                          <p className="text-[10px] text-slate-500 mt-1">As an Amazon Associate, I earn from qualifying purchases.</p>
                        </div>
                        <ArrowRight size={16} className="text-sky-400/40 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0" />
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* ─────────────────────────────────────────────
                  TAB 5: FULL FORENSIC REPORT
                  ───────────────────────────────────────────── */}
              {activeTab === "report" && (
                <>
                  {/* Executive Summary — BIG card */}
                  <div className="bg-slate-950/50 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 sm:p-8 animate-page-enter">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-200/10 to-blue-300/5 border border-blue-200/10 flex items-center justify-center">
                        <FileText size={18} className="text-blue-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Forensic Assessment Report</h3>
                        <p className="text-[10px] text-slate-500">Complete vehicle security posture analysis</p>
                      </div>
                    </div>

                    {/* Report header */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label:"Vehicle", value:`${year} ${make} ${model}`, icon:<Car size={12} /> },
                        { label:"Threat Level", value:threat.level, icon:<Shield size={12} /> },
                        { label:"Risk Score", value:`${threat.score}/100`, icon:<BarChart3 size={12} /> },
                        { label:"Date", value:new Date().toISOString().split("T")[0], icon:<Clock size={12} /> },
                      ].map(item => (
                        <div key={item.label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                          <div className="flex justify-center mb-1.5"><span className="text-blue-200/40">{item.icon}</span></div>
                          <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">{item.label}</div>
                          <div className={`text-[11px] font-mono font-bold mt-0.5 ${item.label === "Threat Level" ? threatTheme.text : "text-slate-300"}`}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Executive summary text */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 mb-5">
                      <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">Executive Summary</h4>
                      <p className="text-[12px] text-slate-400 leading-relaxed">{threat.summary}</p>
                    </div>

                    {/* Key findings */}
                    <div className="mb-5">
                      <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">Key Findings</h4>
                      <div className="space-y-2">
                        {[
                          { finding:`Transponder core identified as ${spec.transponderCore} with ${spec.cryptoStandard}.`, severity:"info" },
                          { finding:`Primary vulnerability: ${spec.primaryVulnerability}. Physical access via ${spec.physicalAccessPoint}.`, severity:"critical" },
                          { finding:`UWB status: ${spec.uwbStatus}. ${spec.uwbStatus.includes("Absent") ? "No distance-bounding protection available." : "Distance-bounding reduces relay attack risk."}`, severity: spec.uwbStatus.includes("Available") ? "success" : "critical" },
                          { finding:`Network topology: ${spec.canTopology}. ${spec.canTopology.includes("Ethernet") ? "Ethernet backbone provides improved isolation." : "Legacy CAN topology with limited segmentation."}`, severity: spec.canTopology.includes("Ethernet") ? "success" : "warning" },
                          { finding:`Recommended countermeasure: ${spec.requiredMitigation}. Implementation priority: ${threat.level === "CRITICAL" ? "Immediate" : threat.level === "HIGH" ? "Within 7 days" : "Within 30 days"}.`, severity:"success" },
                        ].map((f, i) => {
                          const colors = { info:"border-blue-200/10 text-blue-200/50", critical:"border-rose-400/10 text-rose-400/50", warning:"border-amber-400/10 text-amber-400/50", success:"border-emerald-400/10 text-emerald-400/50" };
                          const c = colors[f.severity as keyof typeof colors];
                          return (
                            <div key={i} className={`flex items-start gap-3 bg-white/[0.01] border ${c.split(" ")[0]} rounded-xl p-3.5`}>
                              <div className="mt-0.5">
                                {f.severity === "critical" ? <XCircle size={13} className="text-rose-400/50" /> :
                                 f.severity === "warning" ? <AlertTriangle size={13} className="text-amber-400/50" /> :
                                 f.severity === "success" ? <CheckCircle2 size={13} className="text-emerald-400/50" /> :
                                 <Blocks size={13} className="text-blue-200/50" />}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{f.finding}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hardware profile summary */}
                    <div className="mb-5">
                      <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">Hardware Profile</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { k:"Transponder", v:spec.transponderCore },
                          { k:"Key System", v:spec.keySystem },
                          { k:"LF Channel", v:spec.lfWakeUp },
                          { k:"UHF Channel", v:spec.uhfCarrier },
                          { k:"UWB Status", v:spec.uwbStatus },
                          { k:"Crypto", v:spec.cryptoStandard },
                          { k:"Network", v:spec.canTopology },
                          { k:"Baud Rate", v:spec.baudRate },
                        ].map(item => (
                          <div key={item.k} className="flex items-start gap-2 px-3 py-2 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">{item.k}</span>
                            <span className="text-[10px] font-mono text-slate-400">{item.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compliance */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <BadgeCheck size={14} className="text-blue-200/40 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-200/40 uppercase tracking-[0.1em] mb-1">Compliance & Methodology</p>
                          <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">All data generated from publicly available OEM technical documentation, academic RF engineering publications, and AUTOSAR SecOC reference specifications. No active scanning, cryptographic probing, signal interception, or network penetration was performed.</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Activity size={11} className="text-slate-600" />
                          <span className="text-[9px] font-mono text-slate-600 tracking-wider">AUDIT-{Date.now().toString(36).toUpperCase()}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600">{new Date().toISOString().split("T")[0]}</span>
                      </div>
                    </div>

                    {/* Reset button */}
                    {/* ★ Buy Faraday Box in Report Tab */}
                    {threat && (threat.level === "CRITICAL" || threat.level === "HIGH" || threat.level === "MODERATE") && (
                      <div className="mt-5 relative overflow-hidden rounded-2xl border-2 border-sky-500/20 animate-buy-glow bg-gradient-to-br from-sky-950/30 via-slate-950/50 to-blue-950/30 backdrop-blur-xl">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute inset-0 animate-buy-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent w-1/2 h-full" />
                        </div>
                        <div className={`h-0.5 w-full bg-gradient-to-r ${threat.level === "CRITICAL" ? "from-red-600 via-red-500 to-orange-500" : threat.level === "HIGH" ? "from-amber-600 via-amber-500 to-yellow-500" : "from-sky-600 via-sky-500 to-cyan-400"}`} />
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center animate-icon-bounce">
                              <ShieldAlert size={20} className={threat.level === "CRITICAL" ? "text-red-400" : threat.level === "HIGH" ? "text-amber-400" : "text-sky-400"} />
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-white">Recommended: Procure Rigid Faraday Enclosure</h4>
                              <p className="text-[10px] text-slate-500">Based on this forensic assessment, immediate RF signal containment is advised</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {[
                              { i: <Box size={10} />, t: "Billet Aluminum" },
                              { i: <Zap size={10} />, t: ">90 dB Attenuation" },
                              { i: <Lock size={10} />, t: "Conductive Gasket Seal" },
                              { i: <Star size={10} />, t: "Eliminates Relay Theft" },
                            ].map(p => (
                              <span key={p.t} className="flex items-center gap-1 text-[9px] font-semibold text-slate-300 bg-white/[0.03] border border-white/[0.06] rounded-md px-2 py-0.5">
                                <span className="text-sky-400/60">{p.i}</span>{p.t}
                              </span>
                            ))}
                          </div>
                          <a href="https://amzn.to/4rsnwWe" target="_blank" rel="noopener noreferrer"
                            className="group relative overflow-hidden flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all duration-300 active:scale-[0.97] shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30">
                            <div className="absolute inset-0 overflow-hidden"><div className="absolute inset-0 animate-buy-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/3 h-full" /></div>
                            <ShoppingCart size={16} className="relative z-10" />
                            <span className="relative z-10">Get Faraday Protection on Amazon</span>
                            <ExternalLink size={13} className="relative z-10 opacity-60" />
                          </a>
                          <p className="text-[11px] text-slate-500 mt-3 text-center">
                            As an Amazon Associate, I earn from qualifying purchases.
                          </p>
                        </div>
                      </div>
                    )}

                    <button onClick={handleReset}
                      className="mt-5 w-full group flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-200/10 to-blue-300/5 hover:from-blue-200/20 hover:to-blue-300/10 border border-blue-200/10 hover:border-blue-200/20 text-blue-200 font-bold text-sm rounded-xl transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(148,190,230,0.03)]">
                      <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
                      Start New Forensic Audit
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom watermark */}
      <div className="fixed bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-xl rounded-full border border-white/[0.04]">
          <div className="w-1 h-1 rounded-full bg-blue-200/40 animate-dot-pulse" />
          <span className="text-[8px] font-medium text-slate-500 tracking-[0.15em] uppercase">Forensic Intelligence Suite v5.0</span>
        </div>
      </div>
    </>
  );
}
