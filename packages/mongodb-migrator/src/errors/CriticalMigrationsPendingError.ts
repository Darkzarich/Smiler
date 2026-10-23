export class CriticalMigrationsPendingError extends Error {
  constructor(public readonly migrations: string[]) {
    super(
      `The service cannot start before these migrations run: ${migrations.join(', ')}`,
    );
    this.name = 'CriticalMigrationsPendingError';
  }
}
