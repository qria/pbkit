import { Command } from "https://deno.land/x/cliffy@v0.19.1/command/mod.ts";

const command = new Command();
command
  .name("pb")
  .arguments("<command> [options]")
  .command("gen", (await import("./cmds/gen/index.ts")).default)
  .parse(Deno.args);
