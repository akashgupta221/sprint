import { Router, type IRouter } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const router: IRouter = Router();

/**
 * Locate the OpenAPI spec on disk. In dev we resolve from the workspace
 * via tsx; in the bundled build, the file is copied next to the entrypoint
 * (see api-server build pipeline). We try a few candidate paths so this
 * works in both modes.
 */
function loadSpec(): unknown {
  const candidates = [
    // dev: artifacts/api-server/src/routes/docs.ts -> ../../../lib/api-spec/openapi.yaml
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../../lib/api-spec/openapi.yaml",
    ),
    path.resolve(process.cwd(), "lib/api-spec/openapi.yaml"),
    path.resolve(process.cwd(), "../../lib/api-spec/openapi.yaml"),
    // serverless: the spec ships in the deployment root
    path.resolve(process.cwd(), "openapi.yaml"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return yaml.load(fs.readFileSync(p, "utf8"));
    }
  }
  return {
    openapi: "3.1.0",
    info: { title: "Sprint API", version: "0.0.0" },
    paths: {},
  };
}

const spec = loadSpec();

router.get("/openapi.json", (_req, res): void => {
  res.json(spec);
});

const DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sprint API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" });
    };
  </script>
</body>
</html>`;

router.get("/docs", (_req, res): void => {
  res.type("html").send(DOCS_HTML);
});

router.get("/docs/swagger-ui-bundle.js", (_req, res): void => {
  res.redirect("https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js");
});

export default router;
