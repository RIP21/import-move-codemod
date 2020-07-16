import { declare } from "@babel/helper-plugin-utils";
import { types as t, PluginObj } from "@babel/core";
import typescript from "@babel/plugin-syntax-typescript";
import { Program, ImportSpecifier } from "@babel/types";

type StringMap = { [key: string]: string };

export type Config = {
  module: {
    from: string;
    to: string;
  };
  specifiers: string[] | StringMap;
};

const getFrom = (config: Config) => {
  return config.module.from;
};

const getTo = (config: Config) => {
  return config.module.to;
};

const getSpecifiersList = (config: Config) => {
  return Array.isArray(config.specifiers)
    ? config.specifiers
    : Object.keys(config.specifiers);
};

const shouldRenameSpecifiers = (config: Config) => {
  return !config.specifiers.length;
};

const shouldChangeNamedToDefault = (config: Config) => {
  return (
    !Array.isArray(config.specifiers) &&
    Object.values(config.specifiers).filter((it) => it.includes("default"))
      .length === 1
  );
};

const shouldMoveDefaultToNamed = (config: Config) => {
  return (
    !Array.isArray(config.specifiers) &&
    Object.keys(config.specifiers).filter((it) => it.includes("default"))
      .length === 1
  );
};

const getShouldMoveDefaultToNamedName = (config: Config) => {
  return !Array.isArray(config.specifiers) && config.specifiers.default;
};

const shouldMoveAll = (config: Config) => {
  return Array.isArray(config.specifiers) && config.specifiers[0] === "*";
};

const getNamedIdentifierToDefault = (config: Config) => {
  return Object.entries(config.specifiers).find(
    ([_, value]) => value === "default"
  )?.[0];
};

export default declare((_: any, options: Config) => {
  // if (
  //   options.specifiers?.length === 0 ||
  //   typeof options.specifiers !== "object"
  // ) {
  //   throw new Error(
  //     "Wrong specifiers format provided! It should be non-empty object or array."
  //   );
  // }
  // if (
  //   typeof options.specifiers === "object" &&
  //   Object.values(options.specifiers).filter((it) => it === "default").length >
  //     1
  // ) {
  //   throw new Error(
  //     "It's impossible to make two or more named imports into two or more defaults in one import statement! You should only have one 'default' value in your specifiers mapping"
  //   );
  // }

  if (typeof options === "object" && Object.keys(options).length === 0) {
    return {
      visitor: {},
    };
  }

  return {
    name: "import-move-codemod",
    inherits: typescript,
    visitor: {
      Program(path) {
        const from = getFrom(options);
        const isFromImportIsPresent = !!path.node.body.find((arg) => {
          if (t.isImportDeclaration(arg)) {
            return arg.source.value === from;
          }
          return;
        });
        if (isFromImportIsPresent) {
          return;
        }
      },
      ImportDeclaration(path) {
        const { node } = path;
        const from = getFrom(options);
        const to = getTo(options);
        const specifiers = getSpecifiersList(options);
        const program = path.parent as Program;

        if (t.isImportDeclaration(node) && node.source.value === from) {
          if (shouldMoveAll(options)) {
            path.node.source.value = to;
            return;
          }
          const newImportDeclaration = t.importDeclaration(
            [],
            t.stringLiteral(to)
          );
          // { One: "default" } case
          if (shouldChangeNamedToDefault(options)) {
            if (
              path.node.specifiers.find(
                (it) =>
                  (it as ImportSpecifier)?.imported?.name ===
                  getNamedIdentifierToDefault(options)
              )
            ) {
              newImportDeclaration.specifiers = [
                t.importDefaultSpecifier(
                  t.identifier(getNamedIdentifierToDefault(options))
                ),
              ];

              const filterMovedToDefaultNamedImport = (it: any) =>
                t.isImportSpecifier(it) &&
                !(it.imported.name === getNamedIdentifierToDefault(options));

              path.node.specifiers = path.node.specifiers.filter(
                filterMovedToDefaultNamedImport
              );
            }
          }
          const namedSpecifiersToMove = node.specifiers.filter(
            (it) =>
              t.isImportSpecifier(it) && specifiers.includes(it.imported.name)
          ) as ImportSpecifier[];
          const thereIsSpecifiersToMove = namedSpecifiersToMove.length !== 0;
          // ['One', 'Two'] case
          if (thereIsSpecifiersToMove) {
            if (shouldRenameSpecifiers(options)) {
              const namesMapping = options.specifiers as StringMap;
              const renamedNamedImports = namedSpecifiersToMove.map<
                ImportSpecifier
              >((it: ImportSpecifier) => ({
                ...it,
                local: {
                  ...it.local,
                  name: namesMapping[it.local.name],
                },
                imported: {
                  ...it.imported,
                  name: namesMapping[it.imported.name],
                },
              }));
              newImportDeclaration.specifiers = newImportDeclaration.specifiers.concat(
                renamedNamedImports as typeof newImportDeclaration.specifiers
              );
              path.node.specifiers = path.node.specifiers.filter(
                (it) => !namedSpecifiersToMove.includes(it as ImportSpecifier)
              );
            } else {
              newImportDeclaration.specifiers = newImportDeclaration.specifiers.concat(
                namedSpecifiersToMove as typeof newImportDeclaration.specifiers
              );
            }
          }
          const shouldMoveDefault = specifiers.includes("default");
          // ['default'] case
          if (shouldMoveDefault && !shouldMoveDefaultToNamed(options)) {
            const aDefaultSpecifier = node.specifiers.find((it) =>
              t.isImportDefaultSpecifier(it)
            );
            aDefaultSpecifier &&
              newImportDeclaration.specifiers.unshift(aDefaultSpecifier);
          }
          // { "default" : "One" } case
          if (shouldMoveDefaultToNamed(options)) {
            const aDefaultSpecifier = node.specifiers.find(
              (it) =>
                t.isImportDefaultSpecifier(it) &&
                getShouldMoveDefaultToNamedName(options) === it.local.name
            );
            if (aDefaultSpecifier) {
              const newNamedSpecifier = t.importSpecifier(
                aDefaultSpecifier.local,
                aDefaultSpecifier.local
              );
              newImportDeclaration.specifiers.unshift(newNamedSpecifier);
              path.node.specifiers = path.node.specifiers.filter(
                (it) => !t.isImportDefaultSpecifier(it)
              );
            }
          }
          if (newImportDeclaration.specifiers.length !== 0) {
            program.body.unshift(newImportDeclaration);
            // In case of regular named imports we filter them out from "from" import statement
            path.node.specifiers = path.node.specifiers.filter(
              (it) => !newImportDeclaration.specifiers.includes(it)
            );
            // If it appears to have no import specifiers left after filtering, we're getting rid of it.
            if (path.node.specifiers.length === 0) {
              path.remove();
            }
          }
        }
      },
    },
  } as PluginObj;
});
