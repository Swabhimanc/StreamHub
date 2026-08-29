const generateId = () => Math.random().toString(36).slice(2, 10)

export class PartyRoom {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = new Map()
    this.voiceOn = new Set()
    this.room = {
      code: null,
      host: null,
      participants: [],
      currentState: null,
      media: null,
      shareActive: false,
      createdAt: Date.now(),
    }

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('room')
      if (stored) {
        this.room = stored
      }
    })
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    server.accept()

    const participantId = generateId()
    this.sessions.set(server, { id: participantId, name: null, joined: false })

    server.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data)
        await this.handleMessage(server, participantId, data)
      } catch {
        server.send(JSON.stringify({ type: 'error', message: 'Invalid message' }))
      }
    })

    server.addEventListener('close', async () => {
      this.sessions.delete(server)
      await this.handleDisconnect(participantId)
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async handleMessage(server, participantId, data) {
    const session = this.sessions.get(server)
    if (!session) return

    switch (data.type) {
      case 'join':
        await this.handleJoin(server, participantId, data)
        break
      case 'leave':
        await this.handleLeave(server, participantId)
        break
      case 'party:event': {
        const isHost = this.room.host?.id === participantId
        if (!isHost) break
        this.room.currentState = {
          ...data.event,
          fromParticipantId: participantId,
          timestamp: Date.now(),
        }
        await this.state.storage.put('room', this.room)
        this.broadcast(server, {
          type: 'party:event',
          event: data.event,
          fromParticipantId: participantId,
        })
        break
      }
      case 'request_sync': {
        const hostWs = this.findHostSession()
        if (hostWs) {
          hostWs.ws.send(JSON.stringify({
            type: 'sync_requested',
            fromParticipantId: participantId,
          }))
        } else if (this.room.currentState) {
          session.ws.send(JSON.stringify({
            type: 'room:synced',
            currentState: this.room.currentState,
          }))
        } else {
          session.ws.send(JSON.stringify({
            type: 'room:synced',
            currentState: null,
          }))
        }
        break
      }
      case 'share:start': {
        if (this.room.host?.id !== participantId) break
        this.room.shareActive = true
        await this.state.storage.put('room', this.room)
        this.broadcast(server, {
          type: 'share:started',
          fromParticipantId: participantId,
        })
        break
      }
      case 'share:stop': {
        if (this.room.host?.id !== participantId) break
        this.room.shareActive = false
        await this.state.storage.put('room', this.room)
        this.broadcast(server, {
          type: 'share:stopped',
          fromParticipantId: participantId,
        })
        break
      }
      case 'chat:message': {
        if (!session.joined) break
        const text = typeof data.text === 'string' ? data.text.trim().slice(0, 500) : ''
        if (!text) break
        this.broadcastToAll({
          type: 'chat:message',
          fromParticipantId: participantId,
          fromName: this.room.participants.find(p => p.id === participantId)?.name || session.name || 'Unknown',
          text,
          timestamp: Date.now(),
        })
        break
      }
      case 'voice:state': {
        if (!session.joined) break
        const on = Boolean(data.on)
        if (on) this.voiceOn.add(participantId)
        else this.voiceOn.delete(participantId)
        this.broadcastToAll({ type: 'voice:state', fromParticipantId: participantId, on })
        break
      }
      case 'media:set': {
        if (this.room.host?.id !== participantId) break
        const media = data.media
        if (!media || typeof media.mediaType !== 'string' || !media.mediaId) break
        this.room.media = media
        this.room.currentState = null
        await this.state.storage.put('room', this.room)
        this.broadcastToAll({ type: 'new_media', media })
        break
      }
      case 'rtc:relay': {
        const target = typeof data.target === 'string' ? data.target : null
        if (!target) break
        for (const [ws, sessionTarget] of this.sessions) {
          if (sessionTarget.id === target && sessionTarget.joined) {
            ws.send(JSON.stringify({
              type: 'rtc:relay',
              from: participantId,
              payload: data.payload,
            }))
            break
          }
        }
        break
      }
    }
  }

  async handleJoin(server, participantId, data) {
    const session = this.sessions.get(server)
    if (!session) return

    this.room.code = data.roomCode
    const role = this.room.host === null ? 'host' : 'member'
    session.name = data.name || 'Anonymous'
    session.media = data.media || null
    session.joined = true

    this.room.participants.push({
      id: participantId,
      name: session.name,
      joinedAt: Date.now(),
    })

    if (role === 'host') {
      this.room.host = { id: participantId, name: session.name }
      this.room.media = session.media
      this.room.currentState = null
    }

    session.ws = server
    session.ws.send(JSON.stringify({
      type: 'room:joined',
      roomCode: data.roomCode,
      role,
      participantId,
      isHost: role === 'host',
      media: this.room.media,
      participants: this.room.participants,
      hostId: this.room.host?.id || null,
      shareActive: Boolean(this.room.shareActive),
      voiceParticipants: [...this.voiceOn],
      currentState: role === 'member' ? this.room.currentState : null,
    }))

    this.broadcast(server, {
      type: 'room:state',
      participants: this.room.participants,
      hostId: this.room.host?.id || null,
      joined: true,
    })

    await this.state.storage.put('room', this.room)
  }

  async handleLeave(server, participantId) {
    const session = this.sessions.get(server)
    if (!session) return
    if (this.voiceOn.delete(participantId)) {
      this.broadcastToAll({ type: 'voice:state', fromParticipantId: participantId, on: false })
    }

    this.room.participants = this.room.participants.filter(p => p.id !== participantId)
    this.broadcast(server, {
      type: 'room:left',
      participantId,
    })

    if (this.room.host?.id === participantId) {
      const next = this.room.participants[0]
      this.room.host = next ? { id: next.id, name: next.name } : null
      this.broadcast(server, {
        type: 'room:state',
        participants: this.room.participants,
        hostId: this.room.host?.id || null,
        newHostId: this.room.host?.id || null,
      })
      if (this.room.shareActive) {
        this.room.shareActive = false
        this.broadcastToAll({ type: 'share:stopped', fromParticipantId: participantId })
      }
    }

    await this.state.storage.put('room', this.room)
  }

  async handleDisconnect(participantId) {
    this.room.participants = this.room.participants.filter(p => p.id !== participantId)
    if (this.voiceOn.delete(participantId)) {
      this.broadcastToAll({ type: 'voice:state', fromParticipantId: participantId, on: false })
    }

    if (this.room.host?.id === participantId) {
      const next = this.room.participants[0]
      this.room.host = next ? { id: next.id, name: next.name } : null
      if (this.room.host) {
        this.broadcastToAll({
          type: 'room:state',
          participants: this.room.participants,
          hostId: this.room.host?.id || null,
          newHostId: this.room.host?.id || null,
        })
      } else {
        this.broadcastToAll({
          type: 'room:empty',
        })
      }
      if (this.room.shareActive) {
        this.room.shareActive = false
        this.broadcastToAll({ type: 'share:stopped', fromParticipantId: participantId })
      }
    } else {
      this.broadcastToAll({
        type: 'room:left',
        participantId,
      })
    }

    await this.state.storage.put('room', this.room)
  }

  findHostSession() {
    const hostId = this.room.host?.id
    if (!hostId) return null
    for (const [ws, session] of this.sessions) {
      if (session.id === hostId) return { ws, session }
    }
    return null
  }

  broadcast(excludeWs, message) {
    const data = JSON.stringify(message)
    for (const [ws, session] of this.sessions) {
      if (ws !== excludeWs && session.joined) {
        try { ws.send(data) } catch {}
      }
    }
  }

  broadcastToAll(message) {
    const data = JSON.stringify(message)
    for (const [ws, session] of this.sessions) {
      if (session.joined) {
        try { ws.send(data) } catch {}
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const roomCode = url.pathname.match(/^\/party\/([A-Za-z0-9]+)$/)?.[1]?.toUpperCase()

    if (!roomCode) {
      return new Response('Room code required in URL path: /party/:code', { status: 400 })
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const id = env.PARTY_ROOMS.idFromName(roomCode)
    const stub = env.PARTY_ROOMS.get(id)
    return stub.fetch(request)
  },
}
