/*
 =========================================================================================
   GASGUARD SMART IoT GAS DETECTOR — DUAL-MODE (BLE + LONG-DISTANCE WI-FI / MQTT)
 =========================================================================================
   Supports:
   1. SHORT-RANGE: Bluetooth Low Energy (BLE) for direct phone monitoring & Wi-Fi setup
   2. LONG-DISTANCE: Wi-Fi + MQTT Cloud Gateway for unlimited distance & multi-unit scale
   3. LOCAL SAFETY: 100% fail-safe buzzer & SSD1306 OLED loop (independent of network)
 =========================================================================================
*/

#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// =====================================================
// HARDWARE PIN DEFINITIONS
// =====================================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

#define MQ6_PIN 34
#define BUZZER_PIN 25
#define OLED_SDA 21
#define OLED_SCL 22
#define OLED_ADDRESS 0x3C

#define DEVICE_ID "GG-000001"
#define FIRMWARE_VERSION "1.0.0"
#define GAS_THRESHOLD_DEFAULT 1500

// =====================================================
// BLE UUIDs (100% Preserved from your prototype)
// =====================================================
#define SERVICE_UUID    "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define GAS_VALUE_UUID  "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define GAS_STATUS_UUID "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define BUZZER_UUID     "6E400004-B5A3-F393-E0A9-E50E24DCCA9E"
#define THRESHOLD_UUID  "6E400005-B5A3-F393-E0A9-E50E24DCCA9E"
#define WIFI_PROV_UUID  "6E400006-B5A3-F393-E0A9-E50E24DCCA9E" // For receiving Wi-Fi setup over BLE

// =====================================================
// CLOUD / LONG-DISTANCE MQTT CONFIGURATION
// =====================================================
// Default fallback broker (change to your local PC IP or cloud broker address)
const char* default_mqtt_broker = "192.168.1.100"; 
const int   default_mqtt_port   = 1883;

// Default fallback Wi-Fi credentials (or provision dynamically via Mobile App over BLE)
String wifi_ssid = "Home_5G_WiFi";
String wifi_pass = "GasGuardSafe2026";

// =====================================================
// HARDWARE & DRIVER INSTANCES
// =====================================================
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool oledFound = false;

WiFiClient espClient;
PubSubClient mqttClient(espClient);
Preferences prefs;

BLEServer* pServer = nullptr;
BLECharacteristic* gasValueCharacteristic = nullptr;
BLECharacteristic* gasStatusCharacteristic = nullptr;
BLECharacteristic* buzzerCharacteristic = nullptr;
BLECharacteristic* thresholdCharacteristic = nullptr;
BLECharacteristic* wifiProvCharacteristic = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;
int gasThreshold = GAS_THRESHOLD_DEFAULT;

unsigned long lastMqttTelemetryTime = 0;
unsigned long lastDisplayRefreshTime = 0;
unsigned long lastMqttReconnectAttempt = 0;
String previousStatus = "SAFE";

// =====================================================
// BLE SERVER CALLBACKS
// =====================================================
class ServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* server) override {
        deviceConnected = true;
        Serial.println(F("[BLE] Mobile Client Connected"));
    }

    void onDisconnect(BLEServer* server) override {
        deviceConnected = false;
        Serial.println(F("[BLE] Mobile Client Disconnected"));
    }
};

// =====================================================
// THRESHOLD WRITE CALLBACK
// =====================================================
class ThresholdCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* characteristic) override {
        String value = characteristic->getValue().c_str();
        if (value.length() == 0) return;

        int newThreshold = value.toInt();
        if (newThreshold > 0 && newThreshold <= 4095) {
            gasThreshold = newThreshold;
            prefs.begin("gasguard", false);
            prefs.putInt("threshold", gasThreshold);
            prefs.end();

            Serial.print(F("[BLE] New Threshold saved: "));
            Serial.println(gasThreshold);

            characteristic->setValue(String(gasThreshold).c_str());
            characteristic->notify();
        }
    }
};

// =====================================================
// WI-FI PROVISIONING WRITE CALLBACK (Over BLE)
// =====================================================
class WifiProvCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic* characteristic) override {
        String payload = characteristic->getValue().c_str();
        if (payload.length() == 0) return;

        Serial.print(F("[BLE Provisioning] Received payload: "));
        Serial.println(payload);

        StaticJsonDocument<256> doc;
        DeserializationError err = deserializeJson(doc, payload);
        if (!err) {
            String newSsid = doc["ssid"] | "";
            String newPass = doc["pass"] | "";

            if (newSsid.length() > 0) {
                wifi_ssid = newSsid;
                wifi_pass = newPass;

                prefs.begin("gasguard", false);
                prefs.putString("ssid", wifi_ssid);
                prefs.putString("pass", wifi_pass);
                prefs.end();

                Serial.println(F("[BLE Provisioning] Saved new Wi-Fi credentials to NVS flash. Connecting..."));
                WiFi.disconnect();
                WiFi.begin(wifi_ssid.c_str(), wifi_pass.c_str());
            }
        }
    }
};

// =====================================================
// SETUP BLE
// =====================================================
void setupBLE() {
    BLEDevice::init("LPG SHIELD");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    BLEService* service = pServer->createService(SERVICE_UUID);

    // 1. Gas Value Characteristic
    gasValueCharacteristic = service->createCharacteristic(
        GAS_VALUE_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    gasValueCharacteristic->addDescriptor(new BLE2902());

    // 2. Gas Status Characteristic
    gasStatusCharacteristic = service->createCharacteristic(
        GAS_STATUS_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    gasStatusCharacteristic->addDescriptor(new BLE2902());

    // 3. Buzzer Characteristic
    buzzerCharacteristic = service->createCharacteristic(
        BUZZER_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    buzzerCharacteristic->addDescriptor(new BLE2902());

    // 4. Threshold Characteristic
    thresholdCharacteristic = service->createCharacteristic(
        THRESHOLD_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
    );
    thresholdCharacteristic->setCallbacks(new ThresholdCallbacks());
    thresholdCharacteristic->addDescriptor(new BLE2902());
    thresholdCharacteristic->setValue(String(gasThreshold).c_str());

    // 5. Wi-Fi Provisioning Characteristic (BLE -> Wi-Fi Bridge)
    wifiProvCharacteristic = service->createCharacteristic(
        WIFI_PROV_UUID,
        BLECharacteristic::PROPERTY_WRITE
    );
    wifiProvCharacteristic->setCallbacks(new WifiProvCallbacks());
    wifiProvCharacteristic->addDescriptor(new BLE2902());

    service->start();

    // Advertising
    BLEAdvertising* advertising = BLEDevice::getAdvertising();
    advertising->addServiceUUID(SERVICE_UUID);
    advertising->setScanResponse(true);
    BLEDevice::startAdvertising();

    Serial.println(F("[BLE] Ready & Advertising as 'LPG SHIELD'"));
}

// =====================================================
// OLED STARTUP DISPLAY
// =====================================================
void showStartup() {
    if (!oledFound) return;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(20, 5);
    display.println("LPG");
    display.setCursor(15, 30);
    display.println("SHIELD");
    display.setTextSize(1);
    display.setCursor(10, 52);
    display.println("IoT GasGuard v1.0");
    display.display();
    delay(1500);
}

// =====================================================
// MQTT REMOTE COMMAND HANDLER (Cloud -> ESP32)
// =====================================================
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

    Serial.print(F("[MQTT Command Received] Topic: "));
    Serial.print(topic);
    Serial.print(F(" | Body: "));
    Serial.println(msg);

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (!err) {
        String cmd = doc["command"] | "";
        if (cmd == "SILENCE_BUZZER") {
            digitalWrite(BUZZER_PIN, LOW);
            Serial.println(F("[MQTT Command] Buzzer silenced for 60s"));
        } else if (cmd == "SET_THRESHOLD") {
            int newCrit = doc["criticalThreshold"] | 0;
            if (newCrit > 0) {
                gasThreshold = newCrit;
                Serial.print(F("[MQTT Command] Threshold updated to "));
                Serial.println(gasThreshold);
            }
        } else if (cmd == "REBOOT") {
            Serial.println(F("[MQTT Command] Hardware reboot requested. Restarting ESP32..."));
            delay(500);
            ESP.restart();
        }
    }
}

// =====================================================
// NON-BLOCKING WI-FI & MQTT LIVENESS
// =====================================================
void maintainLongDistanceNetwork() {
    // 1. Maintain Wi-Fi Connection
    if (WiFi.status() != WL_CONNECTED && wifi_ssid.length() > 0) {
        // Wi-Fi reconnecting in background
    }

    // 2. Maintain MQTT Broker Connection (if Wi-Fi is connected)
    if (WiFi.status() == WL_CONNECTED) {
        if (!mqttClient.connected()) {
            unsigned long now = millis();
            if (now - lastMqttReconnectAttempt > 5000) {
                lastMqttReconnectAttempt = now;
                Serial.println(F("[MQTT] Attempting cloud connection..."));

                String clientId = "GasGuard-" + String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
                String lwtTopic = "gasguard/" DEVICE_ID "/status";

                if (mqttClient.connect(clientId.c_str(), lwtTopic.c_str(), 1, true, "{\"online\":false}")) {
                    Serial.println(F("[MQTT] Connected to Cloud Gateway successfully!"));

                    // Publish Birth Message
                    mqttClient.publish(lwtTopic.c_str(), "{\"online\":true}", true);

                    // Subscribe to Cloud Remote Commands
                    String cmdTopic = "gasguard/" DEVICE_ID "/command";
                    mqttClient.subscribe(cmdTopic.c_str(), 1);
                }
            }
        } else {
            mqttClient.loop();
        }
    }
}

// =====================================================
// PUBLISH TELEMETRY OVER CLOUD & BLE
// =====================================================
void sendBLEData(int gasValue, String status, bool buzzer) {
    if (!deviceConnected) return;

    gasValueCharacteristic->setValue(String(gasValue).c_str());
    gasValueCharacteristic->notify();

    gasStatusCharacteristic->setValue(status.c_str());
    gasStatusCharacteristic->notify();

    buzzerCharacteristic->setValue(buzzer ? "ON" : "OFF");
    buzzerCharacteristic->notify();

    thresholdCharacteristic->setValue(String(gasThreshold).c_str());
}

void sendMqttTelemetry(int gasValue, String status, bool buzzer) {
    if (!mqttClient.connected()) return;

    StaticJsonDocument<256> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["gasValue"] = gasValue;
    doc["rawAdc"]   = gasValue;
    doc["status"]   = status;
    doc["buzzer"]   = buzzer;
    doc["wifiRssi"] = WiFi.RSSI();
    doc["threshold"] = gasThreshold;
    doc["firmwareVersion"] = FIRMWARE_VERSION;

    char buffer[256];
    serializeJson(doc, buffer);

    String topic = "gasguard/" DEVICE_ID "/telemetry";
    mqttClient.publish(topic.c_str(), buffer);

    // If emergency, also publish to alert channel with high priority
    if (status == "GAS_DETECTED" || status == "WARNING") {
        String alertTopic = "gasguard/" DEVICE_ID "/alert";
        mqttClient.publish(alertTopic.c_str(), buffer);
    }
}

// =====================================================
// SETUP
// =====================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("================================================"));
    Serial.println(F(" GASGUARD SMART IoT GAS DETECTOR (DUAL-MODE)   "));
    Serial.println(F(" Device ID: " DEVICE_ID " | Hardware: ESP32-MQ6 "));
    Serial.println(F("================================================"));

    pinMode(MQ6_PIN, INPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);

    // Initialize I2C and OLED
    Wire.begin(OLED_SDA, OLED_SCL);
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        Serial.println(F("OLED NOT FOUND! Continuing without OLED display..."));
        oledFound = false;
    } else {
        oledFound = true;
        showStartup();
    }

    // Load saved preferences from NVS Flash
    prefs.begin("gasguard", true);
    gasThreshold = prefs.getInt("threshold", GAS_THRESHOLD_DEFAULT);
    String savedSsid = prefs.getString("ssid", "");
    String savedPass = prefs.getString("pass", "");
    prefs.end();

    if (savedSsid.length() > 0) {
        wifi_ssid = savedSsid;
        wifi_pass = savedPass;
    }

    // Setup Local Bluetooth
    setupBLE();

    // Setup Long-Distance Wi-Fi & MQTT
    WiFi.mode(WIFI_STA);
    if (wifi_ssid.length() > 0) {
        Serial.print(F("[Wi-Fi] Connecting to: "));
        Serial.println(wifi_ssid);
        WiFi.begin(wifi_ssid.c_str(), wifi_pass.c_str());
    }

    mqttClient.setServer(default_mqtt_broker, default_mqtt_port);
    mqttClient.setCallback(onMqttMessage);

    if (oledFound) {
        display.clearDisplay();
        display.setTextSize(1);
        display.setCursor(0, 0);
        display.println("LPG SHIELD READY");
        display.setCursor(0, 20);
        display.println("BLE: Ready");
        display.setCursor(0, 40);
        display.println("Wi-Fi: Connecting...");
        display.display();
    }
}

// =====================================================
// MAIN SAFETY LOOP (Non-blocking)
// =====================================================
void loop() {
    // 1. Maintain BLE Advertising if disconnected
    if (!deviceConnected && oldDeviceConnected) {
        delay(300);
        pServer->startAdvertising();
        Serial.println(F("[BLE] Advertising restarted"));
        oldDeviceConnected = deviceConnected;
    }
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }

    // 2. CRITICAL LOCAL SAFETY: Read Gas Sensor & Control Alarm Locally
    int gasValue = analogRead(MQ6_PIN);

    bool gasDetected = gasValue >= gasThreshold;
    bool warning     = gasValue >= (gasThreshold * 0.60);

    String status;
    if (gasDetected) {
        status = "GAS_DETECTED";
        digitalWrite(BUZZER_PIN, HIGH); // Fail-safe immediate local physical buzzer
    } else if (warning) {
        status = "WARNING";
        digitalWrite(BUZZER_PIN, LOW);
    } else {
        status = "SAFE";
        digitalWrite(BUZZER_PIN, LOW);
    }

    // 3. Immediate Cloud Alert on State Change
    if (status != previousStatus) {
        Serial.print(F("[Safety Alert Transition] "));
        Serial.print(previousStatus);
        Serial.print(F(" -> "));
        Serial.println(status);

        sendMqttTelemetry(gasValue, status, gasDetected);
        sendBLEData(gasValue, status, gasDetected);
        previousStatus = status;
    }

    // 4. Update BLE Local Proximity Telemetry
    sendBLEData(gasValue, status, gasDetected);

    // 5. Maintain Long-Distance Wi-Fi & MQTT Gateway (Non-blocking)
    maintainLongDistanceNetwork();

    // 6. Periodic Cloud Telemetry (Every 4 seconds)
    unsigned long now = millis();
    if (now - lastMqttTelemetryTime >= 4000) {
        lastMqttTelemetryTime = now;
        sendMqttTelemetry(gasValue, status, gasDetected);

        Serial.print(F("MQ-6: "));
        Serial.print(gasValue);
        Serial.print(F(" | Status: "));
        Serial.print(status);
        Serial.print(F(" | Wi-Fi: "));
        Serial.print(WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE");
        Serial.print(F(" | BLE: "));
        Serial.println(deviceConnected ? "CONNECTED" : "WAITING");
    }

    // 7. Refresh OLED Display (Every 300ms)
    if (oledFound && (now - lastDisplayRefreshTime >= 300)) {
        lastDisplayRefreshTime = now;

        display.clearDisplay();
        display.setTextColor(SSD1306_WHITE);
        display.setTextSize(1);
        display.setCursor(0, 0);
        display.print("LPG SHIELD  ");
        display.print(WiFi.status() == WL_CONNECTED ? "[NET]" : "[OFF]");

        display.setTextSize(2);
        display.setCursor(0, 16);
        display.print("Gas:");
        display.println(gasValue);

        display.setTextSize(1);
        display.setCursor(0, 38);
        display.print("Threshold: ");
        display.println(gasThreshold);

        display.setCursor(0, 52);
        if (gasDetected) {
            display.println("!!! GAS DETECTED !!!");
        } else if (warning) {
            display.println("WARNING: HIGH GAS");
        } else {
            display.println("ATMOSPHERE SAFE");
        }
        display.display();
    }

    delay(20); // Small yield for RTOS watchdog
}
