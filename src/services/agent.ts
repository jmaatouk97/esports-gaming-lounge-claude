/**
 * Client-agent command layer.
 *
 * The UI never talks to hardware directly. Every operator action is turned into an AgentCommand and sent
 * through an AgentClient. In this deployment the only implementation is `MockAgentClient`, which SIMULATES
 * the device response. A browser cannot lock, restart or wake a Windows PC by itself — that requires the
 * Windows client agent plus a backend. `WsAgentClient` documents the wire protocol for that future backend.
 */
export type CmdType = 'lock' | 'unlock' | 'restart' | 'shutdown' | 'wol' | 'message' | 'logout' | 'addTime' | 'removeTime' | 'endSession' | 'startSession' | 'assignMember' | 'rdp' | 'screen'
export interface AgentCommand { type: CmdType; stationIds: string[]; payload?: Record<string, unknown>; issuedBy: string }
export interface AgentResult { ok: boolean; simulated: boolean; message: string; latencyMs: number }

export type Role = 'Admin' | 'Manager' | 'Cashier'
const PERMS: Record<Role, CmdType[] | '*'> = {
  Admin: '*',
  Manager: '*',
  Cashier: ['lock', 'unlock', 'message', 'addTime', 'startSession', 'assignMember', 'screen'],
}
export const can = (role: Role, cmd: CmdType) => PERMS[role] === '*' || (PERMS[role] as CmdType[]).includes(cmd)

export interface AgentClient { readonly mode: 'mock' | 'live'; send(c: AgentCommand, role: Role): Promise<AgentResult> }

const LABEL: Record<CmdType, string> = {
  lock: 'Lock', unlock: 'Unlock', restart: 'Restart', shutdown: 'Shutdown', wol: 'Wake on LAN', message: 'Message', logout: 'Force logout', addTime: 'Add time',
  removeTime: 'Remove time', endSession: 'End session', startSession: 'Start session', assignMember: 'Assign member', rdp: 'Remote desktop', screen: 'Live screen',
}
export const cmdLabel = (t: CmdType) => LABEL[t]

class MockAgentClient implements AgentClient {
  readonly mode = 'mock' as const
  async send(c: AgentCommand, role: Role): Promise<AgentResult> {
    const latencyMs = 120 + Math.round(Math.random() * 380)
    await new Promise(r => setTimeout(r, Math.min(latencyMs, 350)))
    if (!can(role, c.type)) return { ok: false, simulated: true, message: `${role} role is not permitted to ${LABEL[c.type].toLowerCase()}`, latencyMs }
    const n = c.stationIds.length
    return { ok: true, simulated: true, message: `${LABEL[c.type]} ${n > 1 ? `${n} stations` : c.stationIds[0]} — simulated, no real device contacted`, latencyMs }
  }
}

/** Wire-protocol reference for the future backend (not instantiated in the demo). */
export class WsAgentClient implements AgentClient {
  readonly mode = 'live' as const
  private ws?: WebSocket
  constructor(private url: string, private token: string) {}
  connect() { this.ws = new WebSocket(`${this.url}?token=${this.token}`) }
  async send(c: AgentCommand): Promise<AgentResult> {
    if (!this.ws || this.ws.readyState !== 1) throw new Error('backend not connected')
    const t0 = performance.now()
    this.ws.send(JSON.stringify({ v: 1, id: crypto.randomUUID(), ...c }))
    return { ok: true, simulated: false, message: 'queued', latencyMs: performance.now() - t0 }
  }
}

export const agent: AgentClient = new MockAgentClient()
