# GasGuard MQTT Topic & Payload Specifications

GasGuard uses MQTT for communication between ESP32 devices and the cloud backend.

## Base Topic Structure
`gasguard/{deviceId}/{channel}`

Where `{deviceId}` is the unique device hardware identifier (e.g. `GG-000001`).

---

## 1. Telemetry Channel
- **Topic:** `gasguard/{deviceId}/telemetry`
- **Direction:** ESP32 → Cloud Backend
- **QoS Level:** 0 or 1
- **Frequency:** Default every 5 seconds (or on threshold transition)

```json
{
  "deviceId": "GG-000001",
  "timestamp": "2026-10-07T12:00:00.000Z",
  "gasValue": 842,
  "rawAdc": 842,
  "status": "SAFE",
  "buzzer": false,
  "wifiRssi": -54,
  "firmwareVersion": "1.0.0",
  "uptimeSeconds": 14250
}
```

---

## 2. Emergency Alert Channel
- **Topic:** `gasguard/{deviceId}/alert`
- **Direction:** ESP32 → Cloud Backend
- **QoS Level:** 2 (Guaranteed exact once delivery)
- **Trigger:** Immediate upon transitioning to `WARNING` or `GAS_DETECTED` state.

```json
{
  "deviceId": "GG-000001",
  "timestamp": "2026-10-07T12:01:00.000Z",
  "gasValue": 1750,
  "status": "GAS_DETECTED",
  "buzzer": true,
  "alertLevel": "CRITICAL",
  "threshold": 1500
}
```

---

## 3. Heartbeat & Liveness Channel
- **Topic:** `gasguard/{deviceId}/heartbeat`
- **Direction:** ESP32 → Cloud Backend
- **QoS Level:** 1
- **Frequency:** Every 30 seconds (or Last Will & Testament)

```json
{
  "deviceId": "GG-000001",
  "timestamp": "2026-10-07T12:05:00.000Z",
  "online": true,
  "sensorStatus": "OK",
  "wifiRssi": -58,
  "freeHeap": 184520,
  "firmwareVersion": "1.0.0"
}
```

### Last Will & Testament (LWT)
- **Topic:** `gasguard/{deviceId}/status`
- **Payload:** `{"deviceId": "GG-000001", "online": false, "reason": "unexpected_disconnect"}`
- **Retain:** `true`

---

## 4. Remote Command Channel
- **Topic:** `gasguard/{deviceId}/command`
- **Direction:** Cloud Backend → ESP32
- **QoS Level:** 1

```json
{
  "command": "SET_THRESHOLD",
  "warningThreshold": 1000,
  "criticalThreshold": 1500,
  "timestamp": "2026-10-07T12:10:00.000Z"
}
```

Commands supported:
- `SET_THRESHOLD`: Updates warning and critical trigger levels.
- `SILENCE_BUZZER`: Temporarily silences buzzer for 60s (if local safety permits).
- `REBOOT`: Reboots device.

---

## 5. Configuration Sync Channel
- **Topic:** `gasguard/{deviceId}/config`
- **Direction:** Cloud Backend → ESP32
- **QoS Level:** 1
- **Retained:** `true`

```json
{
  "warningThreshold": 1000,
  "criticalThreshold": 1500,
  "telemetryIntervalMs": 5000,
  "heartbeatIntervalMs": 30000
}
```
