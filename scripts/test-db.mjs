// Prueba la migración contra un Postgres real en Docker.
//   npm run test:db
// Levanta un contenedor temporal, aplica supabase/migrations/0001_init.sql,
// ejecuta supabase/tests/schema-test.sql y falla si aparece cualquier ERROR.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const supabaseDir = resolve(root, "supabase");
const NAME = "crowns-schema-test";
const IMAGE = "postgres:15-alpine";

const run = (args, options = {}) => spawnSync("docker", args, { encoding: "utf8", ...options });

if (run(["info"]).status !== 0) {
  console.error("Docker no está disponible. Arranca Docker Desktop e inténtalo de nuevo.");
  process.exit(1);
}

run(["rm", "-f", NAME]);
console.log("Levantando Postgres…");
const up = run(["run", "-d", "--name", NAME, "-e", "POSTGRES_PASSWORD=test", "-e", "POSTGRES_DB=crowns", "-v", `${supabaseDir}:/work`, IMAGE]);
if (up.status !== 0) {
  console.error(up.stderr);
  process.exit(1);
}

try {
  let ready = false;
  for (let i = 0; i < 30 && !ready; i++) {
    ready = run(["exec", NAME, "pg_isready", "-U", "postgres"]).status === 0;
    if (!ready) spawnSync(process.execPath, ["-e", "setTimeout(()=>{},1000)"]); // espera ~1s
  }
  if (!ready) throw new Error("Postgres no arrancó a tiempo");

  const result = run(["exec", NAME, "psql", "-U", "postgres", "-d", "crowns", "-q", "-f", "/work/tests/schema-test.sql"]);
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  console.log(output);

  const errors = output.split("\n").filter((line) => /^psql:.*ERROR:/.test(line) || /^ERROR:/.test(line));
  const failures = output.split("\n").filter((line) => line.includes("FALLO"));
  if (errors.length || failures.length) {
    console.error(`\n=> ${errors.length + failures.length} problema(s) en el esquema`);
    process.exit(1);
  }
  console.log("=> esquema correcto: migración, validaciones, vistas y RLS");
} finally {
  run(["rm", "-f", NAME]);
}
