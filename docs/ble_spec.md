# GasGuard BLE Service & Provisioning Protocol

GasGuard physical devices expose Bluetooth Low Energy (BLE) services for local setup, Wi-Fi provisioning, and real-time local monitoring.

## BLE Identifiers
- **Device Advertising Name:** `LPG SHIELD`
- **Main Service UUID:** `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`

---

## GATT Characteristics

| Name | UUID | Properties | Format / Data |
| :--- | :--- | :--- | :--- |
| **GAS_VALUE_UUID** | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` | READ, NOTIFY | `uint16` / String ADC gas reading |
| **GAS_STATUS_UUID** | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` | READ, NOTIFY | String (`SAFE`, `WARNING`, `GAS_DETECTED`) |
| **BUZZER_UUID** | `6E400004-B5A3-F393-E0A9-E50E24DCCA9E` | READ, WRITE, NOTIFY | `0` = Off, `1` = Active |
| **THRESHOLD_UUID** | `6E400005-B5A3-F393-E0A9-E50E24DCCA9E` | READ, WRITE | `uint16` raw ADC threshold |
| **WIFI_PROV_UUID** | `6E400006-B5A3-F393-E0A9-E50E24DCCA9E` | WRITE | JSON string `{"ssid":"...","pass":"..."}` |
| **DEVICE_INFO_UUID** | `6E400007-B5A3-F393-E0A9-E50E24DCCA9E` | READ | JSON string `{"deviceId":"GG-000001","fw":"1.0.0"}` |

---

## Provisioning Workflow

1. **Discovery:** App scans for BLE devices with Service UUID `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` or Advertised Name `LPG SHIELD`.
2. **Connection:** App connects to ESP32 BLE GATT Server.
3. **Read Identity:** App reads `DEVICE_INFO_UUID` to retrieve the device hardware ID (e.g., `GG-000001`).
4. **Provision Credentials:** User inputs local Wi-Fi credentials in app. App writes payload `{"ssid":"MyHomeWifi", "pass":"SecretPass123"}` to `WIFI_PROV_UUID`.
5. **Connection Attempt:** ESP32 saves credentials to NVS (Non-Volatile Storage) preferences, initiates Wi-Fi connection, and attempts MQTT broker handshake.
6. **Confirmation:** ESP32 updates status notification to App.
