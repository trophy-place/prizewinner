# Contributing

All contributions are welcome, I want to have this API covering 100% of the
known endpoints from PSN. You can see most of them listed either
[Playstation Trophies API Documentation](https://andshrew.github.io/PlayStation-Trophies/#/APIv2?id=_1-retrieve-the-trophy-titles-for-a-user)
by [andshrew](https://github.com/andshrew) and my Postman Collection.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/14106843-e19286eb-8d3d-4fcf-97eb-abbe368462b5?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D14106843-e19286eb-8d3d-4fcf-97eb-abbe368462b5%26entityType%3Dcollection%26workspaceId%3D74248cb6-445a-40c0-a1b3-e2f39a55bced)

## Test coverage

End-to-end tests are run on every Pull Request. All features are tested
extensively so that we can try to fix issues before users even need to report
them.

## Setting up your enviroment for contributing

- Clone this repository.
- Edit the `.env` file with your own NPSSO code (this is required to run the
  tests).
- This repository is written using the Deno runtime, so you are going to need to
  have that
  [installed](https://deno.land/manual@v1.35.0/getting_started/installation#download-and-install),
  the
  [deno extension installed](https://deno.land/manual@v1.35.0/references/vscode_deno#using-visual-studio-code)
  on VS Code and
  [initialize your workspace settings](https://deno.land/manual@v1.35.0/references/vscode_deno#configuring-the-extension).
  - If you have never used Deno before, worry not because it's a lot like Node,
    except that is better in every way.
  - Don't worry if the packages in `test.ts` are showing errors, they are cached
    automatically on the first run.
- Create the files below on the root of the project to help you developing
  faster:

```json
// deno.json
{
  "tasks": {
    "start": "deno run --allow-net development.ts",
    "watch": "deno run --allow-net --watch=./development.ts development.ts",
    "test": "deno test --allow-env --allow-read --allow-net ./test.ts"
  }
}
```

```ts
// development.ts
// This is where you are going to work to test your features and import any functions.
```

Before you start writing any code, run `deno task test` to ensure that your
setup is working properly. That will install all the packages and run all tests,
which should all PASS.

Now you can use `deno task start` to run your `development.ts` code and
`deno task test` to test if everything is still working as before.

### Asking for help

If you have difficulty in understanding the code and would like some help in
order to contribute, feel free to reach out on Discord (I'm @theyurig there as
well).

Don't be afraid of being judged, I'm constantly pair programming with junior
software developers, so it's not a problem if you never wrote a test before or
used Typescript or just feel overwhelmed, I'll do my best to get you up to speed
fast.

## How this repository is organized

```
prizewinner/
├─ data/                  // Reused files containing static values
├─ services/              // Utility functions that don't return PSN data
├─ src/                   // Functions that return PSN data and users will directly use
│  ├─ authentication/        // Authentication-related functions
├─ types/                 // Reused files that only contain types, but no data
├─ mod.ts                 // The starting file that exports all user-facing functions
├─ test.ts                // All tests live here 
├─ development.ts ←       // The common starting point for testing and working on features/bugs
```
