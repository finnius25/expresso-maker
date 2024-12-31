#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createResourceTemplates = (name) => ({
  controller: `
export const testHandler = (req, res) => {
  console.log('hello ${name}');
  res.json({ message: 'hello ${name}' });
};`,

  route: `
import { Router } from 'express';
import { testHandler } from '../controllers/${name}.js';

const router = Router();

router.get('/test', testHandler);

export default router;`,
});

const createCoreFiles = (projectName, useFirebase) => {
  const files = {
    "src/app.js": `
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

export default app;`.trim(),

    "src/server.js": `
import app from './app.js';

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(\`Server running on port \${port}\`));`.trim(),

    "src/routes/index.js": `
import { Router } from 'express';
const router = Router();
export default router;`.trim(),
  };

  if (useFirebase) {
    files["src/lib/firebase.js"] = `
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// You can also store the path to your service account json file in .env
// GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
initializeApp();

export const db = getFirestore();`.trim();
  }

  return files;
};

const createPackageJson = (projectName, useFirebase) => {
  const deps = {
    express: "^4.18.2",
    cors: "^2.8.5",
  };

  if (useFirebase) {
    deps["firebase-admin"] = "^11.11.0";
  }

  return {
    name: projectName,
    version: "1.0.0",
    type: "module",
    scripts: {
      start: "node src/server.js",
      dev: "nodemon src/server.js",
    },
    dependencies: deps,
    devDependencies: {
      nodemon: "^2.0.20",
    },
  };
};

const writeProjectFiles = async (projectPath, files) => {
  await Promise.all(
    Object.entries(files).map(([filePath, content]) =>
      fs.writeFile(path.join(projectPath, filePath), content)
    )
  );
};

const createProjectStructure = async (projectPath, useFirebase) => {
  const dirs = ["src/routes", "src/controllers"];
  if (useFirebase) {
    dirs.push("src/lib");
  }

  await Promise.all(dirs.map((dir) => fs.mkdirs(path.join(projectPath, dir))));
};

const handleGenerateResource = async (name) => {
  const srcPath = path.join(process.cwd(), "src");
  if (!(await fs.pathExists(srcPath))) {
    throw new Error(
      "Must be run from project root directory (where src/ folder exists)"
    );
  }

  const templates = createResourceTemplates(name);

  await Promise.all([
    fs.writeFile(
      path.join(process.cwd(), "src", "controllers", `${name}.js`),
      templates.controller.trim()
    ),
    fs.writeFile(
      path.join(process.cwd(), "src", "routes", `${name}.js`),
      templates.route.trim()
    ),
  ]);

  const routesFilePath = path.join(process.cwd(), "src", "routes", "index.js");
  const routeContent = await fs.readFile(routesFilePath, "utf8");

  const addNewRoute = (content) => {
    // Check if import already exists
    if (!content.includes(`import ${name}Routes`)) {
      // Find the last import statement or the start of the file
      const lastImportIndex = content.lastIndexOf("import");
      const lastImportLineEnd =
        lastImportIndex !== -1 ? content.indexOf("\n", lastImportIndex) + 1 : 0;

      // Insert new import after the last import or at the start
      content =
        content.slice(0, lastImportLineEnd) +
        `import ${name}Routes from './${name}.js';\n` +
        content.slice(lastImportLineEnd);
    }

    // Find position to insert route.use statement
    const routerDeclarationIndex = content.indexOf("const router = Router();");
    const afterRouterDeclaration =
      routerDeclarationIndex + "const router = Router();".length;
    const beforeExport = content.indexOf("export default router;");

    // Insert route.use before export if it doesn't exist
    if (!content.includes(`router.use('/${name}s'`)) {
      content =
        content.slice(0, beforeExport) +
        `router.use('/${name}', ${name}Routes);\n` +
        content.slice(beforeExport);
    }

    return content;
  };

  await fs.writeFile(routesFilePath, addNewRoute(routeContent));

  return {
    name,
    files: [
      `src/controllers/${name}.js`,
      `src/routes/${name}.js`,
      "src/routes/index.js",
    ],
  };
};

const handleNewProject = async (name, options) => {
  const projectPath = path.join(process.cwd(), name);
  await createProjectStructure(projectPath, options.firebase);

  const coreFiles = createCoreFiles(name, options.firebase);
  await writeProjectFiles(projectPath, coreFiles);

  await fs.writeFile(
    path.join(projectPath, "package.json"),
    JSON.stringify(createPackageJson(name, options.firebase), null, 2)
  );

  await fs.writeFile(path.join(projectPath, ".env"), "PORT=8080");

  await fs.writeFile(
    path.join(projectPath, ".gitignore"),
    "node_modules\n.env\n"
  );

  return { name, projectPath };
};

const program = new Command();

program
  .command("generate-resource <name>")
  .description("Generate a test endpoint resource")
  .action(async (name) => {
    try {
      const result = await handleGenerateResource(name);
      console.log(
        chalk.green(`
✅ Generated resource: ${result.name}
   ${result.files.map((f) => `- Created: ${f}`).join("\n   ")}
`)
      );
    } catch (error) {
      console.error(chalk.red("Error generating resource:"), error);
      process.exit(1);
    }
  });

program
  .command("new <name>")
  .description("Create a new Express project")
  .option("--firebase", "Include Firebase setup")
  .action(async (name, options) => {
    try {
      const result = await handleNewProject(name, options);
      console.log(
        chalk.green(`
✅ Project created successfully!
To get started:
  cd ${result.name}
  npm install
  npm run dev
`)
      );
    } catch (error) {
      console.error(chalk.red("Error creating project:"), error);
      process.exit(1);
    }
  });

program.parse(process.argv);
