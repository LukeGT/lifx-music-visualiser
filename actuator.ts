import { Client } from 'node-lifx';

const assignments = [
  'Living Room 1',
  'Living Room 2',
  'Living Room 4',
  'Living Room 3',
  'Kitchen 2',
  'Kitchen 1',
  'Dining 2',
  'Dining 1',
];

interface LifxActuator {
  actuate(interpretations: FrequencyInterpretation[]): void;
}

export function start(): LifxActuator {

  const client = new Client();
  client.on('light-new', (light: any) => {
    light.getLabel(() => {
      console.log('Found new light:', light.label);
    });
  });
  client.init({
    resendMaxTimes: 1,
    broadcast: '192.168.1.255',
  });

  return {
    actuate: (interpretations) => {
      for (let index = 0; index < interpretations.length; ++index) {
        const light = client.light(assignments[index]);
        if (!light) continue;
        const interpretation = interpretations[index];
        light.color(
          (interpretation.tone * 360 + 360) % 360,
          interpretation.clarity * 100,
          interpretation.amplitude * 100,
          5000,
          1000/20,
        );
      }
    },
  }
}