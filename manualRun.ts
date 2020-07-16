import { format } from "prettier";

import { transform } from "@babel/core";
import { Config } from "./src";

const check = `
   import One, { Two } from 'one'
`;

const options = {
  module: {
    from: "one",
    to: "two",
  },
  specifiers: { default: "Three" },
} as Config;

const result =
  transform(check, {
    plugins: [["./src/index.ts", options]],
  })?.code ?? "";

console.log(
  format(result, { semi: false, singleQuote: true, parser: "babel" })
);
