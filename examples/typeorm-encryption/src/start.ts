import {getConfig} from "./config";
import main from "./index";

main(getConfig()).then(({server}) => {
  let isShuttingDown = false;

  function shutDown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('Received kill signal, shutting down gracefully');

    setTimeout(() => {
      server.close(() => process.exit());
    }, 0);
  }

  process.on('SIGTERM', shutDown);
  process.on('SIGINT', shutDown);
}).catch(console.error);