const { exec } = require('child_process');
const os = require('os');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      const { address, family, internal } = interface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return '127.0.0.1';
}

const ip = getLocalIpAddress();
console.log(`\nDeploying server to http://${ip}:3000\n`);

// Build and serve
const commands = [
  'npm run build',
  'npm run serve'
];

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${command}: ${error}`);
        reject(error);
        return;
      }
      resolve();
    });

    process.stdout.on('data', (data) => {
      console.log(data);
    });

    process.stderr.on('data', (data) => {
      console.error(data);
    });
  });
}

async function deploy() {
  try {
    for (const command of commands) {
      await runCommand(command);
    }
    console.log(`\nServer is running at http://${ip}:3000\n`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy(); 