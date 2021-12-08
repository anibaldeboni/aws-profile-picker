import os from 'os';
import fs from 'fs';
import prompts from 'prompts';
import { spawn } from 'child_process';

const HOME = os.homedir();
const awsConfigFile = `${HOME}/.aws/config`;

const readConfigFile = (path: string) => fs.readFileSync(path);

const getProfileNames = (configFile: Buffer) => {
  const profileNamesRegex = /(?<=profile\s)[\w-_]+/g;
  const profiles = configFile.toString().match(profileNamesRegex);
  if (!profiles) throw Error('No profiles found');
  return profiles;
};

const buildPromptMenu = (choices: string[]) => choices.map((choice) => ({ title: choice, value: choice }));

const run = (command: string, options: string[]): Promise<number> => new Promise((resolve, reject) => {
  const exec = spawn(command, options);
  exec.stdout.on('data', (data) => console.log(data.toString()));
  exec.stderr.on('data', (data) => console.log(data.toString()));

  exec.on('close', (code) => {
    if (code !== 0) reject(1);
    resolve(0);
  });
});

(async () => {
  const response = await prompts(
    {
      type: 'select',
      name: 'profile',
      message: 'Choose a profile',
      choices: buildPromptMenu(
        getProfileNames(
          readConfigFile(awsConfigFile),
        ),
      ),
    },
  );

  await run('aws', ['sso', 'login', '--profile', response.profile]);
})();
