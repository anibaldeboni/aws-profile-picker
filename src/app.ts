import os from 'os';
import fs from 'fs';
import prompts from 'prompts';
import { spawn, exec } from 'child_process';

const HOME = os.homedir();
const awsConfigFile = `${HOME}/.aws/config`;

const readConfigFile = (path: string) => fs.readFileSync(path);

const getProfileNames = (configFile: Buffer): string[] => {
  const profileNamesRegex = /(?<=profile\s)[\w-_]+/g;
  const profiles = configFile.toString().match(profileNamesRegex);
  if (!profiles) throw Error('No profiles found');
  return profiles;
};

const buildPromptMenu = (choices: string[]) => choices.map((choice) => ({ title: choice, value: choice }));

const run = (command: string, options: string[]): Promise<number> => new Promise((resolve, reject) => {
  const app = spawn(command, options);
  app.stdout.on('data', (data) => console.log(data.toString()));
  app.stderr.on('data', (data) => console.log(data.toString()));

  app.on('close', (code) => {
    if (code !== 0) reject(1);
    resolve(0);
  });
});

(async () => {
  const { profile } = await prompts(
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

  const sso = await run('aws', ['sso', 'login', '--profile', profile]);

  if (sso !== 0) throw new Error('AWS SSO terminated unexpectedly');

  const { runK9s } = await prompts(
    {
      type: 'toggle',
      name: 'runK9s',
      message: 'Wish to run k9s?',
      initial: true,
      active: 'yes',
      inactive: 'no',
    },
  );

  if (runK9s) {
    console.info('Running k9s...');
    exec('k9s').unref();
  }
})();
