// Unified-System-Subsystem-Energy-Transfer-Validator.ts
// SAIA-Class 300 — deterministic subsystem energy transfer validator.

export interface EnergyVector {
  channel: string;     // e.g., "THERMAL", "KINETIC", "ELECTRICAL"
  magnitude: number;   // energy magnitude in arbitrary system units
}

export interface EnergyTransferPacket {
  packetId: string;
  engineId: string;
  subsystemId: string;
  incomingEnergy: EnergyVector[];
  outgoingEnergy: EnergyVector[];
  timestampIso: string;
}

export type EnergyStatus =
  | "ENERGY_CONSERVED"
  | "ENERGY_IMBALANCE"
  | "ENERGY_SURGE"
  | "INVALID_VECTORS"
  | "TIMESTAMP_ERROR";

export interface EnergyRuling {
  rulingId: string;
  packetId: string;
  status: EnergyStatus;
  details: string;
  issuedAtIso: string;
  issuedByEngineId: string;
}

export interface EnergyTransferConfig {
  engineId: string;
  imbalanceThreshold: number;
  surgeThreshold: number;
}

export class UnifiedSystemSubsystemEnergyTransferValidator {
  private readonly config: EnergyTransferConfig;

  constructor(config: EnergyTransferConfig) {
    this.config = config;
  }

  public evaluate(packet: EnergyTransferPacket): EnergyRuling {
    const status = this.resolveStatus(packet);

    return {
      rulingId: this.generateRulingId(packet),
      packetId: packet.packetId,
      status,
      details: this.describe(status),
      issuedAtIso: new Date().toISOString(),
      issuedByEngineId: this.config.engineId,
    };
  }

  private resolveStatus(packet: EnergyTransferPacket): EnergyStatus {
    if (!packet.timestampIso) return "TIMESTAMP_ERROR";

    if (
      !packet.incomingEnergy ||
      !packet.outgoingEnergy ||
      packet.incomingEnergy.length === 0 ||
      packet.outgoingEnergy.length === 0
    ) {
      return "INVALID_VECTORS";
    }

    const incoming = this.computeTotal(packet.incomingEnergy);
    const outgoing = this.computeTotal(packet.outgoingEnergy);

    const imbalance = Math.abs(incoming - outgoing);

    if (imbalance > this.config.surgeThreshold) {
      return "ENERGY_SURGE";
    }

    if (imbalance > this.config.imbalanceThreshold) {
      return "ENERGY_IMBALANCE";
    }

    return "ENERGY_CONSERVED";
  }

  private computeTotal(vectors: EnergyVector[]): number {
    return vectors.reduce((sum, v) => sum + Math.abs(v.magnitude), 0);
  }

  private describe(status: EnergyStatus): string {
    switch (status) {
      case "ENERGY_CONSERVED":
        return "Energy transfer conserved across subsystem boundary.";
      case "ENERGY_IMBALANCE":
        return "Energy imbalance detected; non‑conservative transfer.";
      case "ENERGY_SURGE":
        return "Unsafe energy surge detected; thermodynamic instability risk.";
      case "INVALID_VECTORS":
        return "Energy vectors missing or invalid.";
      case "TIMESTAMP_ERROR":
        return "Missing or invalid timestamp.";
    }
  }

  private generateRulingId(packet: EnergyTransferPacket): string {
    return `ENERGY-${this.config.engineId}-${packet.packetId}-${Date.now()}`;
  }
}

export const DEFAULT_ENERGY_TRANSFER_CONFIG: EnergyTransferConfig = {
  engineId: "Unified-System-Subsystem-Energy-Transfer-Validator-Class-300",
  imbalanceThreshold: 20,
  surgeThreshold: 50,
};
