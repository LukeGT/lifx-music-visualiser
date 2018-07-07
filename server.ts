import * as express from 'express';
import * as socket_io from 'socket.io';
import { Server } from 'http';

const app = express();
const server = new Server(app);
const io = socket_io(server);

app.set('view engine', 'pug');
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

app.get('/', (req, res) => {
  res.render('index');
});

interface ServerInterface {
  send(type: string, data: (number[] | FrequencyInterpretation[])): void;
}

export function start(): ServerInterface {

  const server_instance = <ServerInterface> {
    send: (type, data) => {
      io.emit(type, data);
    }
  };

  server.listen(9842, () => console.log('Listening on port', 9842));

  return server_instance;
}

