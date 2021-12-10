import fs from 'fs';
import which from 'which';
import { spawn } from 'child_process';

export const run = (command: string, options: string[]): Promise<number> => new Promise((resolve, reject) => {
  const app = spawn(command, options);
  app.stdout.on('data', (data) => console.log(data.toString()));
  app.stderr.on('data', (data) => console.log(data.toString()));

  app.on('close', (code) => {
    if (code !== 0) reject(1);
    resolve(0);
  });
});

export const checkIfFileExists = (path: string): boolean => {
  try {
    fs.access(path, fs.constants.F_OK, (error) => {
      if (error) throw new Error();
    },
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const checkIfCommandExists = (command: string): boolean => {
  try {
    which.sync(command);
    return true;
  } catch (error) {
    return false;
  }
};

export const readFile = (path: string) => fs.readFileSync(path);
