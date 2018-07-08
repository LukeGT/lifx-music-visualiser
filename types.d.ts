declare module 'fft.js';
declare module 'node-lifx';

interface FrequencyInterpretation {
  amplitude: number;  // The overall loudness of these frequencies between 0 and 1, relative to prior amplitudes in this range.
  tone: number;  // A single number between 0 and 1 representing the primary pitch of the consituent tones, within an octave.
  clarity: number;  // How pure the above tone is. 0 means all frequencies were heard in equal proportions, 1 means a single frequency was heard clearly.
}

