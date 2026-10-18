#ifndef NETWORK_MANAGER_H
#define NETWORK_MANAGER_H

#include <WiFi.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <vector>
#include "Config.h"

struct BufferedEvent {
  String channel; // "telemetry" or "alert"
  String payload;
};

class NetworkManager {
private:
  WiFiClient espClient;
  PubSubClient mqttClient;
  Preferences preferences;

  String wifiSsid;
  String wifiPass;
  String mqttBroker;
  int mqttPort;

  unsigned long lastWifiRetry;
  unsigned long lastMqttRetry;
  unsigned long lastTelemetrySent;
  unsigned long lastHeartbeatSent;
  
  std::vector<BufferedEvent> offlineBuffer;

public:
  NetworkManager()
    : mqttClient(espClient),
      mqttBroker(DEFAULT_MQTT_BROKER),
      mqttPort(DEFAULT_MQTT_PORT),
      lastWifiRetry(0),
      lastMqttRetry(0),
      lastTelemetrySent(0),
      lastHeartbeatSent(0) {}

  void begin() {
    preferences.begin("gasguard", false);
    wifiSsid = preferences.getString("ssid", "");
    wifiPass = preferences.getString("pass", "");
    mqttBroker = preferences.getString("broker", DEFAULT_MQTT_BROKER);
    mqttPort = preferences.getInt("port", DEFAULT_MQTT_PORT);

    mqttClient.setServer(mqttBroker.c_str(), mqttPort);

    if (wifiSsid.length() > 0) {
      Serial.print(F("[WiFi] Initiating connection to: "));
      Serial.println(wifiSsid);
      WiFi.mode(WIFI_STA);
      WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
    }
  }

  void saveCredentials(const String& ssid, const String& pass) {
    wifiSsid = ssid;
    wifiPass = pass;
    preferences.putString("ssid", ssid);
    preferences.putString("pass", pass);

    WiFi.disconnect();
    WiFi.mode(WIFI_STA);
    WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
    Serial.println(F("[WiFi] Saved new Wi-Fi credentials to NVS Preferences"));
  }

  void update(const String& currentStatus, int currentGasVal, bool buzzerState) {
    unsigned long now = millis();

    // 1. Maintain Wi-Fi non-blocking reconnect
    if (wifiSsid.length() > 0 && WiFi.status() != WL_CONNECTED) {
      if (now - lastWifiRetry >= 10000) { // Retry every 10s
        lastWifiRetry = now;
        Serial.println(F("[WiFi] Reconnecting to Wi-Fi access point..."));
        WiFi.disconnect();
        WiFi.begin(wifiSsid.c_str(), wifiPass.c_str());
      }
    }

    // 2. Maintain MQTT non-blocking reconnect
    if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
      if (now - lastMqttRetry >= 5000) { // Retry every 5s
        lastMqttRetry = now;
        connectMqtt();
      }
    }

    if (mqttClient.connected()) {
      mqttClient.loop();
      flushOfflineBuffer();

      // Periodic Telemetry
      if (now - lastTelemetrySent >= TELEMETRY_INTERVAL_MS) {
        lastTelemetrySent = now;
        publishTelemetry(currentStatus, currentGasVal, buzzerState);
      }

      // Periodic Heartbeat
      if (now - lastHeartbeatSent >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatSent = now;
        publishHeartbeat();
      }
    }
  }

  void publishTelemetry(const String& status, int gasVal, bool buzzerState) {
    JsonDocument doc;
    doc["deviceId"] = DEVICE_ID;
    doc["timestamp"] = getIsoTimestamp();
    doc["gasValue"] = gasVal;
    doc["rawAdc"] = gasVal;
    doc["status"] = status;
    doc["buzzer"] = buzzerState;
    doc["wifiRssi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
    doc["firmwareVersion"] = FIRMWARE_VERSION;

    String payload;
    serializeJson(doc, payload);

    String topic = String("gasguard/") + DEVICE_ID + "/telemetry";

    if (mqttClient.connected()) {
      mqttClient.publish(topic.c_str(), payload.c_str());
    } else {
      bufferEvent("telemetry", payload);
    }
  }

  void publishEmergencyAlert(const String& status, int gasVal, bool buzzerState) {
    JsonDocument doc;
    doc["deviceId"] = DEVICE_ID;
    doc["timestamp"] = getIsoTimestamp();
    doc["gasValue"] = gasVal;
    doc["status"] = status;
    doc["buzzer"] = buzzerState;
    doc["alertLevel"] = (status == "GAS_DETECTED") ? "CRITICAL" : "WARNING";

    String payload;
    serializeJson(doc, payload);

    String topic = String("gasguard/") + DEVICE_ID + "/alert";

    if (mqttClient.connected()) {
      mqttClient.publish(topic.c_str(), payload.c_str(), true); // Retain alert
    } else {
      bufferEvent("alert", payload);
    }
  }

  void publishHeartbeat() {
    JsonDocument doc;
    doc["deviceId"] = DEVICE_ID;
    doc["online"] = true;
    doc["sensorStatus"] = "OK";
    doc["wifiRssi"] = WiFi.RSSI();
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["firmwareVersion"] = FIRMWARE_VERSION;

    String payload;
    serializeJson(doc, payload);

    String topic = String("gasguard/") + DEVICE_ID + "/heartbeat";
    if (mqttClient.connected()) {
      mqttClient.publish(topic.c_str(), payload.c_str());
    }
  }

  bool isWifiConnected() const { return WiFi.status() == WL_CONNECTED; }
  bool isMqttConnected() const { return mqttClient.connected(); }

private:
  void connectMqtt() {
    Serial.println(F("[MQTT] Attempting connection to MQTT broker..."));
    String clientId = String("GasGuard-ESP32-") + DEVICE_ID;
    String statusTopic = String("gasguard/") + DEVICE_ID + "/status";
    String lwtPayload = String("{\"deviceId\":\"") + DEVICE_ID + "\",\"online\":false}";

    if (mqttClient.connect(clientId.c_str(), statusTopic.c_str(), 1, true, lwtPayload.c_str())) {
      Serial.println(F("[MQTT] Connected to MQTT broker!"));
      String cmdTopic = String("gasguard/") + DEVICE_ID + "/command";
      mqttClient.subscribe(cmdTopic.c_str());

      // Send online status
      String onlinePayload = String("{\"deviceId\":\"") + DEVICE_ID + "\",\"online\":true}";
      mqttClient.publish(statusTopic.c_str(), onlinePayload.c_str(), true);
    }
  }

  void bufferEvent(const String& channel, const String& payload) {
    if (offlineBuffer.size() >= BUFFER_MAX_SIZE) {
      offlineBuffer.erase(offlineBuffer.begin()); // Remove oldest
    }
    offlineBuffer.push_back({channel, payload});
    Serial.print(F("[Offline Buffer] Cached event. Current buffer size: "));
    Serial.println(offlineBuffer.size());
  }

  void flushOfflineBuffer() {
    if (offlineBuffer.empty() || !mqttClient.connected()) return;

    Serial.print(F("[Offline Buffer] Flushing "));
    Serial.print(offlineBuffer.size());
    Serial.println(F(" buffered events to MQTT broker..."));

    for (const auto& ev : offlineBuffer) {
      String topic = String("gasguard/") + DEVICE_ID + "/" + ev.channel;
      mqttClient.publish(topic.c_str(), ev.payload.c_str());
    }
    offlineBuffer.clear();
  }

  String getIsoTimestamp() {
    // Basic uptime timestamp fallback if NTP unavailable
    unsigned long s = millis() / 1000;
    return String("UPTIME_S:") + s;
  }
};

#endif // NETWORK_MANAGER_H
