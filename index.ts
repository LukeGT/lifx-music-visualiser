import * as recorder from './recorder';
import * as server from './server';
import * as actuator from './actuator';
import { Interpreter, InterpreterSettings } from './interpreter';

const interpreter = new Interpreter(new InterpreterSettings({
  components: 8,
  overlap: 0.3,
}));

const actuator_instance = actuator.start();
const server_instance = server.start();
const recorder_instance = recorder.start(
  (data) => {
    server_instance.send('data', data);
  },
  (detailed_frequencies, responsive_frequencies) => {

    server_instance.send('detailed_frequencies', detailed_frequencies.amplitudes)
    server_instance.send('responsive_frequencies', responsive_frequencies.amplitudes);

    const interpretations = interpreter.interpret(detailed_frequencies, responsive_frequencies);
    server_instance.send('interpretations', interpretations);

    actuator_instance.actuate(interpretations);
  },
);