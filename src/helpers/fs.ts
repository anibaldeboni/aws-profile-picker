import fs from 'fs';
import which from 'which';
import { spawn } from 'child_process';

export const run = (command: string, options: string[] = []): Promise<number> => new Promise((resolve, reject) => {
  const app = spawn(command, options);
  app.stdout.on('data', (data) => console.log(data.toString()));
  app.stderr.on('data', (data) => console.log(data.toString()));

  app.on('close', (code) => {
    if (code !== 0) reject(`${command} terminated with code: ${code}`);
    resolve(0);
  });
});

export const fileExists = async (path: string) => {
  await fs.promises.access(path, fs.constants.F_OK);
  return true;
};

export const commandExists = (command: string) => {
  return which(command)
    .then(() => true)
    .catch(() => false);
};

export const readFile = (path: string) => fs.readFileSync(path);
