#ifndef BUZZER_MANAGER_H
#define BUZZER_MANAGER_H

#include <Arduino.h>
#include "Config.h"

class BuzzerManager {
private:
  uint8_t pin;
  bool isMuted;
  unsigned long lastToggleTime;
  bool buzzerState;

public:
  BuzzerManager(uint8_t buzzerPin = BUZZER_PIN) : pin(buzzerPin), isMuted(false), lastToggleTime(0), buzzerState(false) {}

  void begin() {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
  }

  void update(const String& statusStr, bool manualOverride = false) {
    if (manualOverride) {
      digitalWrite(pin, HIGH);
      buzzerState = true;
      return;
    }

    if (isMuted) {
      digitalWrite(pin, LOW);
      buzzerState = false;
      return;
    }

    unsigned long currentMillis = millis();

    if (statusStr == "GAS_DETECTED") {
      // Fast rapid alarm tone (100ms ON / 100ms OFF)
      if (currentMillis - lastToggleTime >= 100) {
        lastToggleTime = currentMillis;
        buzzerState = !buzzerState;
        digitalWrite(pin, buzzerState ? HIGH : LOW);
      }
    } else if (statusStr == "WARNING") {
      // Slow pulse warning tone (500ms ON / 500ms OFF)
      if (currentMillis - lastToggleTime >= 500) {
        lastToggleTime = currentMillis;
        buzzerState = !buzzerState;
        digitalWrite(pin, buzzerState ? HIGH : LOW);
      }
    } else {
      // Safe state: silence buzzer
      digitalWrite(pin, LOW);
      buzzerState = false;
    }
  }

  bool isBuzzerActive() const {
    return buzzerState;
  }

  void setMute(bool mute) {
    isMuted = mute;
    if (mute) digitalWrite(pin, LOW);
  }
};

#endif // BUZZER_MANAGER_H
