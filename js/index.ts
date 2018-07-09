/// <reference types="../types"/>

function get_canvas(id: string): HTMLCanvasElement {
  return <HTMLCanvasElement> document.getElementById(id);
}

const socket = io.connect();

socket.on('data', (data: number[]) => {

  const canvas = get_canvas('data');

  const ctx = canvas.getContext('2d');
  if (ctx === null) return console.error('Could not get canvas context.');

  ctx.clearRect(0, 0, 1024, 256);
  ctx.beginPath();
  ctx.moveTo(0, 128);

  for (let index = 0; index < data.length; ++index) {
    ctx.lineTo( index*1024/data.length, 128 + data[index] );
  }

  ctx.stroke();
});

let max_magnitude = 0;

function render_frequencies(id: string, data: number[], frequency_scaler: number, components: ComponentState[], interpretations: FrequencyInterpretation[]) {

  const canvas = get_canvas(id);

  const ctx = canvas.getContext('2d');
  if (ctx === null) return console.error('Could not get canvas context.');

  ctx.clearRect(0, 0, 1024, 512);
  ctx.beginPath();
  ctx.moveTo(0, 512);

  for (let index = 0; index < data.length; ++index) {
    const magnitude = data[index];
    max_magnitude = Math.max(max_magnitude, magnitude);
    ctx.lineTo( Math.log2(index)*1024/Math.log2(data.length), (max_magnitude - magnitude)/max_magnitude * 512);
  }

  ctx.stroke();

  for (let index = 0; index < components.length; ++index) {
    const component = components[index];
    const interpretation = interpretations[index];

    const left = Math.log2(component.min_hz/frequency_scaler) / Math.log2(data.length) * 1024;
    const right = Math.log2(component.max_hz/frequency_scaler) / Math.log2(data.length) * 1024;
    const top = (max_magnitude - Math.sqrt(component.max_amplitude)) / max_magnitude * 512;
    const bottom = (1 - component.min_amplitude) * 512;
    const middle = (1 - interpretation.amplitude) * 512;

    ctx.beginPath();

    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.lineTo(left, top);

    ctx.moveTo(left, middle);
    ctx.lineTo(right, middle);

    ctx.stroke();
  }
}

socket.on('debug', (data: DebugData) => {

  max_magnitude *= 0.9;

  render_frequencies('detailed_frequencies', data.detailed_frequencies, data.detailed_frequency_scaler, data.components, data.interpretations);
  render_frequencies('responsive_frequencies', data.responsive_frequencies, data.responsive_frequency_scaler, data.components, data.interpretations);

  {
    const canvas = get_canvas('responsive_frequencies');

    const ctx = canvas.getContext('2d');
    if (ctx === null) return console.error('Could not get canvas context.');

  }

  document.querySelectorAll('#lights div').forEach( (element: Element, index) => {
    const hue = data.interpretations[index].tone * 360;
    const saturation = data.interpretations[index].clarity * 100;
    const brightness = data.interpretations[index].amplitude * 100;
    (element as HTMLElement).style.backgroundColor = 'hsl(' + hue + ',' + saturation + '%,' + brightness + '%)'
  });
});