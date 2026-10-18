#include <Arduino.h>
#include "Config.h"
#include "DisplayManager.h"
#include "BuzzerManager.h"
#include "GasSensor.h"
#include "BleManager.h"
#include "NetworkManager.h"

// Hardware and Service Component Instances
DisplayManager displayMgr;
BuzzerManager buzzerMgr(BUZZER_PIN);
GasSensor gasSensor(MQ6_PIN);
BleManager bleMgr;
NetworkManager netMgr;

String previousStatus = "SAFE";
unsigned long lastDisplayUpdate = 0;

void setup() {
  Serial.begin(115200);
  Serial.println(F("=========================================="));
  Serial.println(F(" GASGUARD SMART IoT GAS LEAKAGE DETECTOR "));
  Serial.println(F(" Device ID: " DEVICE_ID));
  Serial.println(F(" Firmware:  " FIRMWARE_VERSION));
  Serial.println(F("=========================================="));

  // 1. Initialize Hardware Components
  displayMgr.begin();
  buzzerMgr.begin();
  gasSensor.begin();

  // 2. Initialize BLE Provisioning Server
  bleMgr.begin();

  // 3. Initialize Network & MQTT Manager
  netMgr.begin();

  Serial.println(F("[System] Hardware & Communications Initialized Successfully"));
}

void loop() {
  // CRITICAL SAFETY DIRECTIVE:
  // 1. Read Gas Sensor & Evaluate Local Status (Non-blocking)
  int rawGasAdc = gasSensor.readRawAdc();
  String currentStatus = gasSensor.evaluateStatus(rawGasAdc);

  // 2. Control Physical Alarm Buzzer Locally (Independent of network)
  buzzerMgr.update(currentStatus);

  // 3. Trigger Emergency MQTT Alert if status transitions to WARNING or GAS_DETECTED
  if (currentStatus != previousStatus) {
    Serial.print(F("[Safety Alert] Status state changed from "));
    Serial.print(previousStatus);
    Serial.print(F(" to "));
    Serial.println(currentStatus);

    if (currentStatus == "GAS_DETECTED" || currentStatus == "WARNING") {
      netMgr.publishEmergencyAlert(currentStatus, rawGasAdc, buzzerMgr.isBuzzerActive());
    }
    previousStatus = currentStatus;
  }

  // 4. Process BLE Provisioning Credentials if received from Mobile App
  if (bleMgr.hasNewWifiCredentials()) {
    String newSsid, newPass;
    bleMgr.getWifiCredentials(newSsid, newPass);
    displayMgr.showMessage("Wi-Fi Config Received", "Connecting to " + newSsid);
    netMgr.saveCredentials(newSsid, newPass);
  }

  // 5. Update BLE GATT Characteristics
  bleMgr.updateTelemetry(
    rawGasAdc,
    currentStatus,
    buzzerMgr.isBuzzerActive(),
    gasSensor.getWarningThreshold()
  );

  // 6. Network & MQTT Reconnect / Telemetry Processing (Non-blocking)
  netMgr.update(currentStatus, rawGasAdc, buzzerMgr.isBuzzerActive());

  // 7. Refresh OLED Screen (Every 250ms)
  unsigned long now = millis();
  if (now - lastDisplayUpdate >= 250) {
    lastDisplayUpdate = now;
    displayMgr.updateDisplay(
      currentStatus,
      rawGasAdc,
      netMgr.isWifiConnected(),
      netMgr.isMqttConnected(),
      bleMgr.isConnected()
    );
  }

  // Minimal yield for system watchdog timer
  delay(10);
}
