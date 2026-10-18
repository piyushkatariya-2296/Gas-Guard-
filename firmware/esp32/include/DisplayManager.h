#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Config.h"

class DisplayManager {
private:
  Adafruit_SSD1306 display;

public:
  DisplayManager() : display(OLED_SCREEN_WIDTH, OLED_SCREEN_HEIGHT, &Wire, OLED_RESET) {}

  bool begin() {
    Wire.begin(OLED_SDA, OLED_SCL);
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
      Serial.println(F("[OLED] SSD1306 allocation failed!"));
      return false;
    }
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(10, 20);
    display.println(F("GASGUARD IoT"));
    display.setCursor(10, 35);
    display.println(F("Initializing..."));
    display.display();
    return true;
  }

  void updateDisplay(const String& statusStr, int gasValue, bool isWifiConnected, bool isMqttConnected, bool isBleConnected) {
    display.clearDisplay();

    // Top status bar
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print(F("ID: "));
    display.print(F(DEVICE_ID));

    display.setCursor(85, 0);
    if (isWifiConnected) display.print(F("WIFI"));
    else display.print(F("OFF"));

    display.setCursor(110, 0);
    if (isBleConnected) display.print(F("BLE"));

    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

    // Main status text
    display.setCursor(0, 16);
    display.print(F("STATUS: "));
    
    if (statusStr == "GAS_DETECTED") {
      display.setTextSize(2);
      display.setCursor(0, 28);
      display.println(F("!! DANGER !!"));
    } else if (statusStr == "WARNING") {
      display.setTextSize(2);
      display.setCursor(0, 28);
      display.println(F("WARNING"));
    } else {
      display.setTextSize(2);
      display.setCursor(0, 28);
      display.println(F("SAFE"));
    }

    // Bottom reading bar
    display.setTextSize(1);
    display.setCursor(0, 52);
    display.print(F("ADC Level: "));
    display.print(gasValue);

    display.display();
  }

  void showMessage(const String& line1, const String& line2) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 10);
    display.println(line1);
    display.setCursor(0, 30);
    display.println(line2);
    display.display();
  }
};

#endif // DISPLAY_MANAGER_H
