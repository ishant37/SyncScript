import test from "node:test"
import assert from "node:assert/strict"
import {
  connectRedis,
  disconnectRedis,
  getRedisStatus,
} from "../config/redis.js"

test("Redis can be explicitly disabled for single-instance development", async () => {
  const originalEnabled = process.env.REDIS_ENABLED
  const originalRequired = process.env.REDIS_REQUIRED

  process.env.REDIS_ENABLED = "false"
  process.env.REDIS_REQUIRED = "false"

  try {
    assert.equal(await connectRedis(), null)
    assert.deepEqual(getRedisStatus(), {
      enabled: false,
      required: false,
      connected: false,
      mode: "single-instance",
    })
  } finally {
    await disconnectRedis()
    process.env.REDIS_ENABLED = originalEnabled
    process.env.REDIS_REQUIRED = originalRequired
  }
})

test("required Redis configuration fails without a URL", async () => {
  const originalEnabled = process.env.REDIS_ENABLED
  const originalRequired = process.env.REDIS_REQUIRED
  const originalUrl = process.env.REDIS_URL

  process.env.REDIS_ENABLED = "true"
  process.env.REDIS_REQUIRED = "true"
  delete process.env.REDIS_URL

  try {
    await assert.rejects(connectRedis, /REDIS_URL is required/)
  } finally {
    await disconnectRedis()
    process.env.REDIS_ENABLED = originalEnabled
    process.env.REDIS_REQUIRED = originalRequired
    process.env.REDIS_URL = originalUrl
  }
})
