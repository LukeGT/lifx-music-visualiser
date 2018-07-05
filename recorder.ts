import { spawn } from 'child_process';
import * as FFT from 'fft.js';

const SAMPLES_PER_EVENT = 4096;
const BUFFERED_SAMPLES = 8;
const RESPONSIVE_SAMPLES = 2;
const EVENTS_PER_SECOND = 15;
const MAX_OUTPUT_FREQUENCY = 2500;
const OUTPUT_FREQUENCIES = Math.floor(MAX_OUTPUT_FREQUENCY/EVENTS_PER_SECOND);

const ring_buffer: Buffer[] = new Array(BUFFERED_SAMPLES);
let ring_buffer_index = 0;

const fft_detailed = new FFT(SAMPLES_PER_EVENT * BUFFERED_SAMPLES);
const fft_detailed_output = fft_detailed.createComplexArray();

const fft_responsive = new FFT(SAMPLES_PER_EVENT * RESPONSIVE_SAMPLES);
const fft_responsive_output = fft_responsive.createComplexArray();

export function start(
  on_data: (data: number[]) => void,
  on_frequencies: (detailed_frequencies: number[], responsive_frequencies: number[]) => void,
): void {

  const recording_process = spawn('arecord', [
    '--rate', String(EVENTS_PER_SECOND * SAMPLES_PER_EVENT),
    '--period-size', String(SAMPLES_PER_EVENT),
    '--format', 'U8',
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  recording_process.stdout.on('data', (samples: Buffer) => {

    let samples_index = 0;
    while (samples_index + SAMPLES_PER_EVENT <= samples.length) {
      ring_buffer[ring_buffer_index] = samples.slice(samples_index, samples_index + SAMPLES_PER_EVENT);
      ring_buffer_index = (ring_buffer_index+1) % BUFFERED_SAMPLES;
      samples_index += SAMPLES_PER_EVENT;
    }

    // Ensure that the ring buffer is full
    for (const buffer of ring_buffer) {
      if (buffer === undefined) {
        return;
      }
    }

    // Concatenate together all of the samples within the ring buffer for detailed frequencies
    const detailed_input = new Array(SAMPLES_PER_EVENT * BUFFERED_SAMPLES);
    let current_ring_buffer_index = ring_buffer_index;
    for (let input_index = 0; input_index < detailed_input.length; ++input_index) {
      if (input_index % SAMPLES_PER_EVENT === 0) {
        current_ring_buffer_index = (current_ring_buffer_index+1) % BUFFERED_SAMPLES;
      }
      detailed_input[input_index] = ring_buffer[current_ring_buffer_index][input_index % SAMPLES_PER_EVENT] - 128;
    }
    on_data(detailed_input);

    // Just take the latest sample for the responsive frequencies
    const responsive_input = detailed_input.slice(detailed_input.length - SAMPLES_PER_EVENT * RESPONSIVE_SAMPLES, detailed_input.length);

    fft_detailed.realTransform(fft_detailed_output, detailed_input);
    fft_responsive.realTransform(fft_responsive_output, responsive_input);

    on_frequencies(
      fft_detailed_output.slice(0, 2 * OUTPUT_FREQUENCIES * BUFFERED_SAMPLES),
      fft_responsive_output.slice(0, 2 * OUTPUT_FREQUENCIES * RESPONSIVE_SAMPLES),
    );
  });

  recording_process.stdout.on('error', (error: string) => {
    console.error('Microphone output error: ' + error);
  });

  recording_process.stderr.on('data', (data: Buffer) => {
    console.error(data.toString());
  });
}