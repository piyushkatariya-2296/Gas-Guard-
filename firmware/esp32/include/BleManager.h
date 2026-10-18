#ifndef BLE_MANAGER_H
#define BLE_MANAGER_H

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include "Config.h"

class BleManagerCallbacks;

class BleManager {
private:
  BLEServer* pServer;
  BLEService* pService;
  BLECharacteristic* pGasValChar;
  BLECharacteristic* pGasStatusChar;
  BLECharacteristic* pBuzzerChar;
  BLECharacteristic* pThresholdChar;
  BLECharacteristic* pWifiProvChar;
  BLECharacteristic* pDeviceInfoChar;

  bool deviceConnected;
  String pendingSsid;
  String pendingPass;
  bool newWifiCredentialsReceived;

public:
  BleManager() : pServer(nullptr), pService(nullptr), deviceConnected(false), newWifiCredentialsReceived(false) {}

  void begin();
  void updateTelemetry(int gasVal, const String& status, bool buzzerActive, int threshold);

  bool isConnected() const { return deviceConnected; }
  bool hasNewWifiCredentials() const { return newWifiCredentialsReceived; }
  void getWifiCredentials(String& ssid, String& pass) {
    ssid = pendingSsid;
    pass = pendingPass;
    newWifiCredentialsReceived = false;
  }

  void setConnected(bool connected) { deviceConnected = connected; }
  void setWifiCredentials(const String& ssid, const String& pass) {
    pendingSsid = ssid;
    pendingPass = pass;
    newWifiCredentialsReceived = true;
  }
};

class ServerCallbacks : public BLEServerCallbacks {
private:
  BleManager* manager;
public:
  ServerCallbacks(BleManager* mgr) : manager(mgr) {}
  void onConnect(BLEServer* pServer) override {
    manager->setConnected(true);
    Serial.println(F("[BLE] Mobile app connected to BLE GATT Server"));
  }
  void onDisconnect(BLEServer* pServer) override {
    manager->setConnected(false);
    Serial.println(F("[BLE] Mobile app disconnected from BLE"));
    BLEDevice::startAdvertising();
  }
};

class WifiProvCallbacks : public BLECharacteristicCallbacks {
private:
  BleManager* manager;
public:
  WifiProvCallbacks(BleManager* mgr) : manager(mgr) {}
  void onWrite(BLECharacteristic* pCharacteristic) override {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.println(F("[BLE] Received Wi-Fi credentials payload"));
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, value);
      if (!error) {
        String ssid = doc["ssid"] | "";
        String pass = doc["pass"] | "";
        if (ssid.length() > 0) {
          manager->setWifiCredentials(ssid, pass);
        }
      }
    }
  }
};

inline void BleManager::begin() {
  BLEDevice::init(BLE_DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks(this));

  pService = pServer->createService(SERVICE_UUID);

  pGasValChar = pService->createCharacteristic(
    GAS_VALUE_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pGasValChar->addDescriptor(new BLE2902());

  pGasStatusChar = pService->createCharacteristic(
    GAS_STATUS_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pGasStatusChar->addDescriptor(new BLE2902());

  pBuzzerChar = pService->createCharacteristic(
    BUZZER_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
  );
  pBuzzerChar->addDescriptor(new BLE2902());

  pThresholdChar = pService->createCharacteristic(
    THRESHOLD_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE
  );
  pThresholdChar->addDescriptor(new BLE2902());

  pWifiProvChar = pService->createCharacteristic(
    WIFI_PROV_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pWifiProvChar->setCallbacks(new WifiProvCallbacks(this));

  pDeviceInfoChar = pService->createCharacteristic(
    DEVICE_INFO_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  JsonDocument infoDoc;
  infoDoc["deviceId"] = DEVICE_ID;
  infoDoc["firmwareVersion"] = FIRMWARE_VERSION;
  infoDoc["hardware"] = HARDWARE_REVISION;
  String infoStr;
  serializeJson(infoDoc, infoStr);
  pDeviceInfoChar->setValue(infoStr.c_str());

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println(F("[BLE] BLE GATT Server started and advertising as 'LPG SHIELD'"));
}

inline void BleManager::updateTelemetry(int gasVal, const String& status, bool buzzerActive, int threshold) {
  if (!deviceConnected) return;

  pGasValChar->setValue(String(gasVal).c_str());
  pGasValChar->notify();

  pGasStatusChar->setValue(status.c_str());
  pGasStatusChar->notify();

  pBuzzerChar->setValue(buzzerActive ? "1" : "0");
  pBuzzerChar->notify();

  pThresholdChar->setValue(String(threshold).c_str());
}

#endif // BLE_MANAGER_H
