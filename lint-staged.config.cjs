const path = require('node:path');

const quote = (value) => `'${value.replace(/'/g, "'\\''")}'`;

const toAbsoluteFile = (file) =>
  path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

const toRelativeFiles = (files, fromDir = process.cwd()) =>
  files.map((file) => quote(path.relative(fromDir, toAbsoluteFile(file))));

const command = (base, files, fromDir) =>
  `${base} ${toRelativeFiles(files, fromDir).join(' ')}`;

const filterByExtension = (files, extensions) =>
  files.filter((file) => extensions.includes(path.extname(file)));

const filterRootFiles = (files) =>
  files.filter(
    (file) =>
      path.dirname(toAbsoluteFile(file)) === process.cwd() &&
      path.basename(file) !== 'pnpm-lock.yaml',
  );

const filterSpellcheckFiles = (files) =>
  files.filter(
    (file) => !['package.json', 'pnpm-lock.yaml'].includes(path.basename(file)),
  );

const prettier = (dir, files) =>
  command(
    `pnpm --dir ${dir} exec prettier --write`,
    files,
    path.join(process.cwd(), dir),
  );

const spellcheck = (files) =>
  command('pnpm exec cspell --no-progress --no-summary', files);

const spellcheckTasks = (files) => {
  const spellcheckFiles = filterSpellcheckFiles(files);

  if (spellcheckFiles.length === 0) {
    return [];
  }

  return [spellcheck(spellcheckFiles)];
};

const root = (files) => {
  const rootFiles = filterRootFiles(files);

  if (rootFiles.length === 0) {
    return [];
  }

  return [
    command(
      'pnpm exec prettier --write --config packages/frontend/prettier.config.js',
      rootFiles,
    ),
    ...spellcheckTasks(rootFiles),
  ];
};

const backend = (files) => {
  const codeFiles = filterByExtension(files, ['.js', '.ts']);
  const tasks = [prettier('packages/backend', files)];
  const fromDir = path.join(process.cwd(), 'packages/backend');

  if (codeFiles.length > 0) {
    tasks.push(
      command(
        'pnpm --filter backend exec eslint --fix --ext .js --ext .ts --ignore-path .gitignore',
        codeFiles,
        fromDir,
      ),
    );
    tasks.push('pnpm --filter backend lint:types');
  }

  tasks.push(...spellcheckTasks(files));

  return tasks;
};

const frontend = (files) => {
  const codeFiles = filterByExtension(files, ['.js', '.ts', '.vue']);
  const styleFiles = filterByExtension(files, ['.css', '.scss', '.vue']);
  const tasks = [
    prettier('packages/frontend', files),
    ...spellcheckTasks(files),
  ];
  const fromDir = path.join(process.cwd(), 'packages/frontend');

  if (codeFiles.length > 0) {
    tasks.push(
      command(
        'pnpm --filter frontend exec eslint --fix --ext .js,.ts,.vue --ignore-path .gitignore',
        codeFiles,
        fromDir,
      ),
    );
    tasks.push('pnpm --filter frontend lint:types');
  }

  if (styleFiles.length > 0) {
    tasks.push(
      command(
        'pnpm --filter frontend exec stylelint --fix',
        styleFiles,
        fromDir,
      ),
    );
  }

  return tasks;
};

module.exports = {
  '*.{js,cjs,json,md,yml,yaml}': root,
  'packages/backend/**/*.{js,ts,json,md,yml,yaml}': backend,
  'packages/frontend/**/*.{js,ts,vue,css,scss,html,json,md,yml,yaml}': frontend,
};
