import os from 'os';
import prompts from 'prompts';
import chalk from 'chalk';
import { exec } from 'child_process';
import { checkIfCommandExists, checkIfFileExists, readFile, run } from './helpers/fs';

const AWS_CONFIG_FILE = `${os.homedir()}/.aws/config`;

const getProfileNames = (configFile: Buffer): string[] => {
  const profileNamesRegex = /(?<=profile\s)[\w-_]+/g;
  const profiles = configFile.toString().match(profileNamesRegex);
  if (!profiles) throw Error('No profiles found');
  return profiles;
};

const buildPromptMenu = (choices: string[]) => choices.map((choice) => ({ title: choice, value: choice }));

const checkAWS = async () => {
  const awsConfigIsPresent = checkIfFileExists(AWS_CONFIG_FILE);
  const awsCliIsPresent = checkIfCommandExists('aws');

  if (!awsCliIsPresent || !awsConfigIsPresent) {
    const OK = chalk.greenBright('ok');
    const NOT_FOUND = chalk.redBright('not found');

    console.error(
      `${chalk.bold('Some dependecies were not found!')}\n`,
      `· aws-cli: ${awsCliIsPresent ? OK : NOT_FOUND}\n`,
      `· config file (~/.aws/config): ${awsConfigIsPresent ? OK : NOT_FOUND}`,
    );
    process.exit(1);
  }
};

const promptAwsProfile = async () => {
  const { profile } = await prompts(
    {
      type: 'select',
      name: 'profile',
      message: 'Choose a profile',
      choices: buildPromptMenu(
        getProfileNames(
          readFile(AWS_CONFIG_FILE),
        ),
      ),
    },
  );

  if (!profile) {
    console.error('No profile selected. Exiting');
    process.exit(0);
  }

  const sso = await run('aws', ['sso', 'login', '--profile', profile]);

  if (sso !== 0) {
    console.error('AWS SSO terminated unexpectedly');
    process.exit(1);
  }
};

const promptK9s = async () => {
  if (checkIfCommandExists('k9s')) {
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
  }
};

(async () => {
  await checkAWS();

  await promptAwsProfile();

  await promptK9s();
})();
