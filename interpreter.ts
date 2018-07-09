import { Frequencies } from './recorder';

export class InterpreterSettings {

  readonly components: number = 1;
  readonly overlap: number = 0;
  readonly min_hz: number = 35;
  readonly max_hz: number = 2000;
  readonly max_amplitude_decay: number = 0.99;
  readonly min_amplitude_decay: number = 0.9;
  readonly min_max_amplitude: number = 100;

  constructor (settings: {
    components?: number,
    overlap?: number,
    min_hz?: number,
    max_hz?: number,
  }) {
    Object.assign(this, settings);
  }
}

class ComponentState {

  readonly min_hz: number;
  readonly max_hz: number;

  max_amplitude: number = 0;
  min_amplitude: number = 0;
  cumulative_amplitude: number = 0;
  num_samples_amplitude: number = 0;

  cumulative_tone_x: number = 0;
  cumulative_tone_y: number = 0;
  cumulative_tone_length: number = 0;
  num_samples_tone: number = 0;

  constructor(
    min_base_2_hz: number,
    octaves: number,
  ) {
    this.min_hz = +(2**min_base_2_hz).toFixed(3);
    this.max_hz = +(2**(min_base_2_hz+octaves)).toFixed(3);
  }
}

export class Interpreter {

  readonly components: ComponentState[];

  constructor (private settings: InterpreterSettings) {

    const min_base_2_hz = Math.log2(settings.min_hz);
    const max_base_2_hz = Math.log2(settings.max_hz);
    const octaves = max_base_2_hz - min_base_2_hz;
    const component_width = octaves / (settings.components + settings.overlap - settings.components * settings.overlap);
    const component_gap = component_width * (1 - settings.overlap);

    this.components = Array.from(Array(settings.components), (_, index) => {
      return new ComponentState(min_base_2_hz + component_gap * index, component_width);
    });

    console.log('Each component spans', component_width, 'octaves');
    console.log(this.components);
  }

  interpret(detailed_frequencies: Frequencies, responsive_frequencies: Frequencies): FrequencyInterpretation[] {

    for (const component of this.components) {

      component.max_amplitude *= this.settings.max_amplitude_decay;
      component.min_amplitude *= this.settings.min_amplitude_decay;
      component.cumulative_amplitude = 0;
      component.num_samples_amplitude = 0;

      component.cumulative_tone_x = 0;
      component.cumulative_tone_y = 0;
      component.cumulative_tone_length = 0;
      component.num_samples_tone = 0;
    }

    for (let index = 0; index < responsive_frequencies.amplitudes.length; ++index) {
      const frequency = index * responsive_frequencies.frequency_scaler;
      // TODO: optimize this loop by starting at a clever index
      for (const component of this.components) {
        if (frequency >= component.max_hz) continue;
        if (frequency < component.min_hz) break;
        component.cumulative_amplitude += responsive_frequencies.amplitudes[index]**2;
        ++component.num_samples_amplitude;
      }
    }

    for (let index = 0; index < detailed_frequencies.amplitudes.length; ++index) {
      const frequency = index * detailed_frequencies.frequency_scaler;
      const tone_angle = Math.PI*2 * Math.log2(frequency);
      // TODO: optimize this loop by starting at a clever index
      for (const component of this.components) {
        if (frequency >= component.max_hz) continue;
        if (frequency < component.min_hz) break;
        const influence = detailed_frequencies.amplitudes[index]**2;
        component.cumulative_tone_x += Math.cos(tone_angle) * influence;
        component.cumulative_tone_y += Math.sin(tone_angle) * influence;
        component.cumulative_tone_length += influence;
        ++component.num_samples_tone;
      }
    }

    for (const component of this.components) {
      component.max_amplitude = Math.max(component.max_amplitude, component.cumulative_amplitude/component.num_samples_amplitude);
    }    

    return Array.from(Array(this.settings.components), (_, index) => {

      const component = this.components[index];
      const neighbouring_max_amplitude = Math.max(
        this.settings.min_max_amplitude,
        component.max_amplitude,
        index-1 >= 0 ? this.components[index-1].max_amplitude : 0,
        index+1 < this.components.length ? this.components[index+1].max_amplitude : 0,
      );
      const amplitude = Math.max(
        component.min_amplitude,
        (component.cumulative_amplitude/component.num_samples_amplitude) / neighbouring_max_amplitude
      );
      component.min_amplitude = amplitude;

      return {
        amplitude: amplitude,
        tone: Math.atan2(component.cumulative_tone_y, component.cumulative_tone_x)/(Math.PI*2),
        clarity: Math.sqrt(component.cumulative_tone_x**2 + component.cumulative_tone_y**2) / component.cumulative_tone_length,
      }
    });
  }
}