import * as recorder from './recorder';
import * as server from './server';

const server_instance = server.start();
const recorder_instance = recorder.start(
  (data) => {
    server_instance.send('data', data);
  },
  (detailed_frequencies, responsive_frequencies) => {
    server_instance.send('detailed_frequencies', detailed_frequencies)
    server_instance.send('responsive_frequencies', responsive_frequencies);
  },
);