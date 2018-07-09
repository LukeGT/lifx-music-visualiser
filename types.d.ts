declare module 'fft.js';
declare module 'node-lifx';

interface FrequencyInterpretation {
  amplitude: number;  // The overall loudness of these frequencies between 0 and 1, relative to prior amplitudes in this range.
  tone: number;  // A single number between 0 and 1 representing the primary pitch of the consituent tones, within an octave.
  clarity: number;  // How pure the above tone is. 0 means all frequencies were heard in equal proportions, 1 means a single frequency was heard clearly.
}

declare class ComponentState {

  readonly min_hz: number;
  readonly max_hz: number;

  max_amplitude: number;
  min_amplitude: number;
  cumulative_amplitude: number;
  num_samples_amplitude: number;

  cumulative_tone_x: number;
  cumulative_tone_y: number;
  cumulative_tone_length: number;
  num_samples_tone: number;

  constructor(
    min_base_2_hz: number,
    octaves: number,
  )
}

interface DebugData {
  detailed_frequencies: number[];
  detailed_frequency_scaler: number;
  responsive_frequencies: number[];
  responsive_frequency_scaler: number;
  interpretations: FrequencyInterpretation[];
  components: ComponentState[];
}