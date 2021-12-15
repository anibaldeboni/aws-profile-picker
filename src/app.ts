import os from 'os';
import prompts from 'prompts';
import chalk from 'chalk';
import { commandExists, fileExists, readFile, run } from './helpers/fs';

const AWS_CONFIG_FILE = `${os.homedir()}/.aws/config`;

const getProfileNames = (configFile: Buffer): string[] => {
  const profileNamesRegex = /(?<=profile\s)[\w-_]+/g;
  const profiles = configFile.toString().match(profileNamesRegex);
  if (!profiles) throw Error('No profiles found');
  return profiles;
};

const buildPromptMenu = (choices: string[]) => choices.map((choice) => ({ title: choice, value: choice }));

const checkAWS = async () => {
  const awsConfigIsPresent = await fileExists(AWS_CONFIG_FILE);
  const awsCliIsPresent = await commandExists('aws');

  if (!awsCliIsPresent || !awsConfigIsPresent) {
    const OK = chalk.greenBright('ok');
    const NOT_FOUND = chalk.redBright('not found');

    throw new Error(
      `${chalk.bold('Some dependecies were not found 😵')}
· aws-cli: ${awsCliIsPresent ? OK : NOT_FOUND}
· config file (~/.aws/config): ${awsConfigIsPresent ? OK : NOT_FOUND}`,
    );
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
    throw new Error('No profile selected. Exiting');
  }

  return run('aws', ['sso', 'login', '--profile', profile]);
};

const promptK9s = async () => {
  const k9sIsPresent = await commandExists('k9s');
  if (k9sIsPresent) {
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
      console.info('🐶 launching k9s...');
      return run('k9s');
    }
  }
};

(async () => {
  try {
    await checkAWS();
    await promptAwsProfile();
    await promptK9s();

    process.exit(0);

  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
})();
