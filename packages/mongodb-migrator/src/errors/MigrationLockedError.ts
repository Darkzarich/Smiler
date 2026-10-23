export class MigrationLockedError extends Error {
  constructor(
    public readonly owner: string,
    public readonly acquiredAt: Date,
  ) {
    super(
      `Another migrator (${owner}) holds the lock since ${acquiredAt.toISOString()}. ` +
        'Wait for it to finish; a lock whose holder died expires on its own.',
    );
    this.name = 'MigrationLockedError';
  }
}
