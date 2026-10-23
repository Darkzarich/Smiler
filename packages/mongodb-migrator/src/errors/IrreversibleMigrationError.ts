export class IrreversibleMigrationError extends Error {
  constructor(
    public readonly migration: string,
    public readonly reason: string,
  ) {
    super(
      `${migration} cannot be reverted: ${reason}. Restore the backup taken before it ran instead.`,
    );
    this.name = 'IrreversibleMigrationError';
  }
}
