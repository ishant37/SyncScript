import { createClient } from "redis"

let pubClient
let subClient
let redisEnabled = false
let redisRequired = false

function logRedisEvent(label, event, error) {
  if (event === "error") {
    console.error(`Redis ${label} error`, error?.message || "unknown error")
    return
  }

  console.log(`Redis ${label} ${event}`)
}

function attachRedisEvents(client, label) {
  client.on("connect", () => logRedisEvent(label, "connecting"))
  client.on("ready", () => {
    client.hasConnected = true
    logRedisEvent(label, "ready")
  })
  client.on("reconnecting", () => logRedisEvent(label, "reconnecting"))
  client.on("end", () => logRedisEvent(label, "connection closed"))
  client.on("error", (error) => logRedisEvent(label, "error", error))
}

function createRedisClient(redisUrl) {
  let client

  client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries, cause) => {
        if (!client?.hasConnected && retries >= 3) {
          return cause
        }

        return Math.min(retries * 250, 2000)
      },
    },
  })

  return client
}

function isEnabled(value) {
  return value?.toLowerCase() === "true"
}

export async function connectRedis() {
  redisRequired = isEnabled(process.env.REDIS_REQUIRED)
  redisEnabled = isEnabled(process.env.REDIS_ENABLED) || redisRequired

  if (!redisEnabled) {
    console.log("Redis disabled; using single-instance Socket.IO mode")
    return null
  }

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    const error = new Error("REDIS_URL is required when REDIS_ENABLED=true")

    if (redisRequired) {
      throw error
    }

    console.error(`${error.message}; using single-instance Socket.IO mode`)
    redisEnabled = false
    return null
  }

  pubClient = createRedisClient(redisUrl)
  subClient = createRedisClient(redisUrl)
  attachRedisEvents(pubClient, "publisher")
  attachRedisEvents(subClient, "subscriber")

  try {
    const connection = Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ])
    const timeout = Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 5000

    await Promise.race([
      connection,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`connection timed out after ${timeout}ms`)),
          timeout,
        )
      }),
    ])
    console.log("Redis connected; Socket.IO multi-instance mode enabled")
    return { pubClient, subClient }
  } catch (error) {
    await disconnectRedis()

    if (redisRequired) {
      throw new Error(
        `Redis connection failed: ${error.message || "unknown error"}`,
      )
    }

    console.error(
      `Redis connection failed: ${error.message || "unknown error"}; using single-instance Socket.IO mode`,
    )
    redisEnabled = false
    return null
  }
}

export async function disconnectRedis() {
  const clients = [pubClient, subClient].filter(Boolean)

  await Promise.all(
    clients.map(async (client) => {
      if (client.isReady) {
        await client.quit()
      } else if (client.isOpen) {
        client.destroy()
      }
    }),
  )

  pubClient = undefined
  subClient = undefined
}

export function isRedisConnected() {
  return Boolean(pubClient?.isReady && subClient?.isReady)
}

export function getRedisStatus() {
  return {
    enabled: redisEnabled,
    required: redisRequired,
    connected: isRedisConnected(),
    mode: isRedisConnected()
      ? "multi-instance"
      : redisEnabled
        ? "redis-unavailable"
        : "single-instance",
  }
}
