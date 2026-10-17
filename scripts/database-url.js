const REQUIRED_DATABASE_VARIABLES = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];

function hasDatabaseConfiguration(environment = process.env) {
  if (environment.DATABASE_URL?.trim()) {
    return true;
  }

  return REQUIRED_DATABASE_VARIABLES.every(
    (name) => environment[name] !== undefined && environment[name] !== "",
  );
}

function configureDatabaseUrl(environment = process.env) {
  const configuredUrl = environment.DATABASE_URL?.trim();

  if (configuredUrl) {
    let parsedUrl;
    try {
      parsedUrl = new URL(configuredUrl);
    } catch {
      throw new Error("DATABASE_URL must be a valid MySQL connection URL.");
    }

    if (parsedUrl.protocol !== "mysql:") {
      throw new Error("DATABASE_URL must use the mysql protocol.");
    }

    environment.DATABASE_URL = parsedUrl.toString();
    return environment.DATABASE_URL;
  }

  const missingVariables = REQUIRED_DATABASE_VARIABLES.filter(
    (name) => environment[name] === undefined || environment[name] === "",
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing database environment variable(s): ${missingVariables.join(", ")}. Set DATABASE_URL or all required DB_* variables.`,
    );
  }

  const databaseUrl = new URL("mysql://localhost");
  databaseUrl.hostname = environment.DB_HOST;
  databaseUrl.port = environment.DB_PORT || "3306";
  databaseUrl.username = environment.DB_USER;
  databaseUrl.password = environment.DB_PASSWORD;
  databaseUrl.pathname = `/${environment.DB_NAME}`;
  environment.DATABASE_URL = databaseUrl.toString();
  return environment.DATABASE_URL;
}

module.exports = { configureDatabaseUrl, hasDatabaseConfiguration };
