#ifndef GAS_SENSOR_H
#define GAS_SENSOR_H

#include <Arduino.h>
#include "Config.h"

class GasSensor {
private:
  uint8_t pin;
  int warningThreshold;
  int criticalThreshold;
  int runningSum;
  int sampleIndex;
  static const int NUM_SAMPLES = 10;
  int samples[NUM_SAMPLES];

public:
  GasSensor(uint8_t sensorPin = MQ6_PIN)
    : pin(sensorPin),
      warningThreshold(DEFAULT_WARNING_THRESHOLD),
      criticalThreshold(DEFAULT_CRITICAL_THRESHOLD),
      runningSum(0),
      sampleIndex(0) {
    for (int i = 0; i < NUM_SAMPLES; i++) samples[i] = 0;
  }

  void begin() {
    pinMode(pin, INPUT);
    // Warm up samples
    int initialVal = analogRead(pin);
    for (int i = 0; i < NUM_SAMPLES; i++) {
      samples[i] = initialVal;
      runningSum += initialVal;
    }
  }

  int readRawAdc() {
    runningSum -= samples[sampleIndex];
    int rawVal = analogRead(pin);
    samples[sampleIndex] = rawVal;
    runningSum += rawVal;
    sampleIndex = (sampleIndex + 1) % NUM_SAMPLES;
    return runningSum / NUM_SAMPLES;
  }

  String evaluateStatus(int rawAdc) {
    if (rawAdc >= criticalThreshold) {
      return "GAS_DETECTED";
    } else if (rawAdc >= warningThreshold) {
      return "WARNING";
    }
    return "SAFE";
  }

  void setThresholds(int warning, int critical) {
    if (warning > 0) warningThreshold = warning;
    if (critical > warning) criticalThreshold = critical;
  }

  int getWarningThreshold() const { return warningThreshold; }
  int getCriticalThreshold() const { return criticalThreshold; }
};

#endif // GAS_SENSOR_H
