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

socket.on('detailed_frequencies', (data: number[]) => {
  const canvas = get_canvas('detailed_frequencies');

  const ctx = canvas.getContext('2d');
  if (ctx === null) return console.error('Could not get canvas context.');

  ctx.clearRect(0, 0, 1024, 512);
  ctx.beginPath();
  ctx.moveTo(0, 512);

  max_magnitude *= 0.9;

  for (let index = 2; index < data.length; index += 2) {
    const magnitude = Math.sqrt(data[index]**2 + data[index+1]**2);
    max_magnitude = Math.max(max_magnitude, magnitude);
    ctx.lineTo( Math.log2(index)*1024/Math.log2(data.length), (max_magnitude - magnitude)/max_magnitude * 512);
  }

  ctx.stroke();
});


socket.on('responsive_frequencies', (data: number[]) => {
  const canvas = get_canvas('responsive_frequencies');

  const ctx = canvas.getContext('2d');
  if (ctx === null) return console.error('Could not get canvas context.');

  ctx.clearRect(0, 0, 1024, 512);
  ctx.beginPath();
  ctx.moveTo(0, 512);

  max_magnitude *= 0.9;

  for (let index = 2; index < data.length; index += 2) {
    const magnitude = Math.sqrt(data[index]**2 + data[index+1]**2);
    max_magnitude = Math.max(max_magnitude, magnitude);
    ctx.lineTo( Math.log2(index)*1024/Math.log2(data.length), (max_magnitude - magnitude)/max_magnitude * 512);
  }

  ctx.stroke();
});