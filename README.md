# import-move-codemod
![npm](https://img.shields.io/npm/v/import-move-codemod)

Codemod to move imports from one module to another. Super useful in huge monorepos or huge migrations of 3rd party packages.

## Usage

Inside your project root run
For `npm`
```
npm i import-move-codemod --save-dev
```
or for `yarn`
```
yarn add import-move-codemod --dev
```
or for `pnpm`
```
pnpm add import-move-codemod --D
```

Before the run you need to create a file with a config, let say `codemod.json`
```json
{
  "module": {
    "from": "one",
    "to": "two"
  },
  "specifiers": ["One"]
}
```

Then for example to run codemod against all the files in `/src` run 
```
npx @codemod/cli -p import-move-codemod -o import-move-codemod=@codemod.json --printer prettier /src 
```




## What refactorings are available

### Move of one or multiple named imports from one module to another

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["One"]
}
```

```ts
import { One } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { One } from 'two';
```

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["One", "Two"]
}
```

```ts
import { One, Two } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { One, Two } from 'two';
```

```ts
import { One as OneA, Two as TwoA } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { One as OneA, Two as TwoA } from 'two';

```

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["Two"]
}
```

```ts
import { One, Two } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { Two } from 'two';
import { One } from 'one';
```

### Move named imports and default in one go

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["default", "One", "Two"]
}
```


```ts
import ADefault, { One, Two, Three } from 'one'

//     ↓ ↓ ↓ ↓ ↓ ↓

import ADefault, { One, Two } from 'two';
import { Three } from 'one';
```

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["default", "Two"]
}
```

```ts
import One, { Two } from 'one'

 //     ↓ ↓ ↓ ↓ ↓ ↓

import One, { Two } from 'two';
```

### Move everything i.e. module rename

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["*"]
}
```

```ts
import ADefault, { One, Two, Three } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import ADefault, { One, Two, Three } from 'two';

```

### Move named imports and rename them

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: {
    One: "OneR",
    Two: "TwoR"
  }
}
```

```ts
import ADefault, { One, Two } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { OneR, TwoR } from 'two';
import ADefault from 'one';
```

```ts
import { One, Two } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { OneR, TwoR } from 'two';
```

### Move default import to named
```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: { default: "One" }
}
```

```ts
import One, { Two } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { One } from 'two';
import { Two } from 'one';
```

```ts
import One from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import { One } from 'two';
```

### Move only default import

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: ["default"]
}
```

```ts
import ADefault, { One, Two, Three } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import ADefault from 'two';
import { One, Two, Three } from 'one';
```

```ts
import One from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import One from 'two';
```

### Make default import from named

```
{
  module: {
    from: "one",
    to: "two"
  },
  specifiers: {
    One: "default"
  }
}
```

```ts
import { One } from 'one'

//      ↓ ↓ ↓ ↓ ↓ ↓

import One from 'two';
```
