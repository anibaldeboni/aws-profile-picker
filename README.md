# aws-sso-cli

A simple cli to choose aws profiles and run SSO

## Packaging
```
$ npm install
$ npm run build
$ cp ./dist/index ~/.local/bin/aws-sso
```
Make sure `~/.local/bin` is in your `$PATH` variable

## Usage

```
$ aws-sso
```

If `k9s` is installed in your system the app will ask if you want to launch it.
