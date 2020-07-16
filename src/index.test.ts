import pluginTester from "babel-plugin-tester";
import transform, { Config } from "./index";

const { format } = require("prettier");

pluginTester({
  pluginName: "import-rename-codemod",
  plugin: transform,
  snapshot: true,
  formatResult: (output: any) =>
    format(output, {
      semi: true,
      singleQuote: true,
      parser: "babel",
    }),
  tests: [
    {
      title:
        "When named to named import and only one imported should change current import",
      code: `
      import { One } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["One"],
      } as Config,
    },
    {
      title:
        "When named to named import and multiple imported and only one identifier moved it should keep one import and create new import",
      code: `
      import { One, Two } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["Two"],
      } as Config,
    },
    {
      title:
        "When named to named import and multiple imported and all moved it should keep and change import",
      code: `
      import { One, Two } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["One", "Two"],
      } as Config,
    },
    {
      title:
        "When named to named with 'as' import and multiple imported and all moved it should keep and change import",
      code: `
      import { One as OneA, Two as TwoA } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["One", "Two"],
      } as Config,
    },
    {
      title: "When named to named and imports should be renamed",
      code: `
      import { One, Two } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: {
          One: "OneR",
          Two: "TwoR",
        },
      } as Config,
    },
    {
      title:
        "When named to named and imports should be renamed and default should be preserved",
      code: `
      import ADefault, { One, Two } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: {
          One: "OneR",
          Two: "TwoR",
        },
      } as Config,
    },
    {
      title: "When named to default should change import",
      code: `
      import { One } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: {
          One: "default",
        },
      } as Config,
    },
    {
      title: "When wildcard should move all imports",
      code: `
      import ADefault, { One, Two, Three } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["*"],
      } as Config,
    },
    {
      title: "Should move only default import",
      code: `
      import ADefault, { One, Two, Three } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["default"],
      } as Config,
    },
    {
      title: "Should move default import and named imports",
      code: `
      import ADefault, { One, Two, Three } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["default", "One", "Two"],
      } as Config,
    },
    {
      title: "Should move default to named",
      code: `
      import One from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: { default: "One" },
      } as Config,
    },
    {
      title: "Should move default to named while keeping others that are left",
      code: `
      import One, { Two } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: { default: "One" },
      } as Config,
    },
    {
      title: "Should move default to named and move others along",
      code: `
      import One, { Two } from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: { default: "One", Two: "Two" },
      } as Config,
    },
    {
      title: "Should move default to default",
      code: `
      import One from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: ["default"],
      } as Config,
    },
    {
      title:
        "Should fail when asked to create impossible two or more defaults from named imports",
      code: `
      import One from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: { One: "default", Two: "default" },
      } as Config,
      error:
        "It's impossible to make two named imports into two defaults! You should only have one 'default' value in your specifiers mapping",
    },
    {
      title: "Should fail when provided with wrong config shape",
      code: `
      import One from 'one'
      `,
      pluginOptions: {
        module: {
          from: "one",
          to: "two",
        },
        specifiers: "Wrong",
      },
      error:
        "Wrong specifiers format provided! It should be non-empty object or array.",
    },
  ],
});
