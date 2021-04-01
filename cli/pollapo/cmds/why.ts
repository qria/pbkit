import { bold, red, yellow } from "https://deno.land/std@0.91.0/fmt/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v0.18.0/command/mod.ts";
import { jsonTree } from "https://deno.land/x/json_tree/mod.ts";
import { println } from "../misc/stdio.ts";
import { getCacheDir } from "../config.ts";
import {
  analyzeDeps,
  getPollapoYml,
  PollapoYmlNotFoundError,
} from "../pollapoYml.ts";

interface Options {
  depth: number;
}

export default new Command()
  .arguments("<targets...:string>")
  .description("Show information about why dependency is installed")
  .option("-d, --depth <depth:number>", "Depth of display dependency tree", {
    default: 3,
  })
  .action(async (options: Options, targets: string[]) => {
    try {
      const { depth } = options;
      const cacheDir = getCacheDir();
      const pollapoYml = await getPollapoYml();
      const analyzeDepsResult = await analyzeDeps({ cacheDir, pollapoYml });

      const makeWhyTree = (depName: string, depArray: string[]) => {
        if (depName === "<root>") {
          return null;
        }

        if (depArray.length > depth) {
          return "...";
        }

        type TreeNode = string | Tree | null;
        interface Tree {
          [key: string]: TreeNode;
        }

        const tree: Tree = {};
        const [name, version] = depName.split("@");
        if (
          !Object.keys(analyzeDepsResult).includes(name) ||
          !Object.keys(analyzeDepsResult[name]).includes(version)
        ) {
          throw new PollapoDependencyNotFoundError(depName);
        }
        analyzeDepsResult[name][version].froms.map((from: string) => {
          tree[from] = depArray.includes(from)
            ? "cycle"
            : makeWhyTree(from, [...depArray, from]);
        });

        return tree;
      };

      await println(bold(`Pollapo why`));
      await println(`Current tree depth: ${yellow(depth.toString())}`);
      await println(``);

      for (const target of targets) {
        if (target.includes("@")) {
          await println(yellow(`📚 ${target}`));
          await println(jsonTree(makeWhyTree(target, [target]), true));
        } else {
          if (
            !analyzeDepsResult[target]
          ) {
            throw new PollapoDependencyNotFoundError(target);
          }
          for await (const version of Object.keys(analyzeDepsResult[target])) {
            const depName = [target, version].join("@");
            await println(yellow(`📚 ${depName}`));
            await println(jsonTree(makeWhyTree(depName, [depName]), true));
          }
        }
      }
    } catch (err) {
      if (
        err instanceof PollapoNotLoggedInError ||
        err instanceof PollapoYmlNotFoundError ||
        err instanceof PollapoDependencyNotFoundError
      ) {
        console.error(red(err.message));
        return Deno.exit(1);
      }
      // TODO: handle not found error
      throw err;
    }
  });

class PollapoNotLoggedInError extends Error {
  constructor() {
    super("Login required.");
  }
}

class PollapoDependencyNotFoundError extends Error {
  constructor(missingDep: string) {
    super(`${missingDep}: Dependency not found.`);
  }
}
