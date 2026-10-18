# GasGuard ESP32 Firmware & Hardware Documentation

## Hardware Specifications & Wiring Schematic

| Component | Pin on ESP32 | Function |
| :--- | :--- | :--- |
| **MQ-6 Sensor AO** | GPIO 34 (Analog A0) | Gas Concentration Analog Input |
| **Buzzer (+)** | GPIO 25 (Digital Out) | Local Emergency Buzzer Alarm |
| **SSD1306 OLED SDA**| GPIO 21 (I2C SDA) | Display Screen Data |
| **SSD1306 OLED SCL**| GPIO 22 (I2C SCL) | Display Screen Clock |
| **Power VCC** | 5V / Vin | Module Power (MQ-6 requires 5V heater) |
| **GND** | GND | Common Ground |

---

## Hardware Safety & Calibration Note
1. **MQ-6 Preheating:** The MQ-6 sensor relies on an internal heating element and requires a 24-hour initial burn-in period and a 3-minute warmup upon power-up for stable readings.
2. **ADC Thresholds:** ESP32 uses a 12-bit ADC (range 0 to 4095). Default Warning threshold is set to `1000` ADC (~25% scale) and Critical threshold is `1500` ADC (~37% scale). These values are fully configurable locally via BLE and remotely via MQTT commands.
3. **Fail-Safe Alarm:** The local C++ loop in `src/main.cpp` executes independently of Wi-Fi, MQTT, BLE, or internet state. The physical buzzer will sound regardless of network availability.

---

## Build & Flash Instructions using PlatformIO

```bash
cd firmware/esp32

# Build firmware binary
pio run

# Flash to connected ESP32 over USB-C / Micro-USB
pio run --target upload

# Monitor Serial Output
pio device monitor -b 115200
```
