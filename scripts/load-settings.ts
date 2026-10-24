import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Preload environment variables for standalone Node scripts. File values
 * deliberately take precedence over values inherited from the shell.
 */
const environmentName = process.argv[2];

if (
  environmentName !== undefined &&
  !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(environmentName)
) {
  throw new Error(
    `Invalid environment name "${environmentName}". ` +
      'Use only letters, numbers, hyphens and underscores.'
  );
}

if (environmentName === 'shell') {
  console.warn('Shell-only settings mode selected; no settings file was loaded.');
} else {
  const settingsFile = environmentName
    ? `${environmentName}.settings.json`
    : 'local.settings.json';
  const settingsPath = resolve(process.cwd(), settingsFile);
  const source = readSettingsFile(settingsPath, settingsFile, {
    required: environmentName !== undefined,
  });

  if (source !== undefined) {
    loadSettings(source, settingsFile);

    if (environmentName !== undefined) {
      console.warn(
        `Loaded ${settingsFile}; variables not listed in Values ` +
          'remain inherited from the shell.'
      );
    }
  }
}

function readSettingsFile(
  settingsPath: string,
  settingsFile: string,
  options: { readonly required: boolean }
): string | undefined {
  try {
    return readFileSync(settingsPath, 'utf8');
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      if (options.required) {
        throw new Error(`Selected settings file ${settingsFile} was not found.`);
      }

      console.warn(
        `Settings file ${settingsFile} was not found; ` +
          'using existing environment variables.'
      );
      return undefined;
    }

    throw new Error(`Unable to read ${settingsFile}.`, { cause: error });
  }
}

function loadSettings(source: string, settingsFile: string): void {
  let settings: unknown;
  try {
    settings = JSON.parse(source);
  } catch {
    // JSON parser details can include fragments of a secret value.
    throw new Error(`Unable to parse ${settingsFile} as JSON.`);
  }

  if (!hasValuesObject(settings)) {
    throw new Error(`${settingsFile} must contain a Values object.`);
  }

  for (const [name, value] of Object.entries(settings.Values)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(
        `${settingsFile} contains an invalid environment variable name: ${name}`
      );
    }

    if (!['string', 'number', 'boolean'].includes(typeof value)) {
      throw new Error(
        `${settingsFile} contains a non-scalar value for environment variable ${name}.`
      );
    }

    if (Object.hasOwn(process.env, name)) {
      // Report only the variable name so diagnostics never disclose either value.
      console.warn(
        `Settings file ${settingsFile} overrides environment variable ${name}.`
      );
    }

    process.env[name] = String(value);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function hasValuesObject(
  settings: unknown
): settings is { Values: Record<string, unknown> } {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return false;
  }

  const values = 'Values' in settings ? settings.Values : undefined;
  return Boolean(values) && typeof values === 'object' && !Array.isArray(values);
}
