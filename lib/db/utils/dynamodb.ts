/**
 * DynamoDB Utility Functions
 *
 * Shared utilities for building DynamoDB commands
 */

/**
 * Build update expression for DynamoDB UpdateCommand
 *
 * Automatically handles:
 * - Expression attribute names (#field)
 * - Expression attribute values (:field)
 * - UpdateExpression construction
 * - updatedAt timestamp
 *
 * @example
 * const update = buildUpdateExpression({ status: 'active', title: 'New Title' });
 * await db.send(new UpdateCommand({
 *   TableName: 'MyTable',
 *   Key: { id: '123' },
 *   ...update
 * }));
 */
export function buildUpdateExpression(updates: Record<string, any>) {
  // Add updatedAt automatically
  const allUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};

  Object.entries(allUpdates).forEach(([key, value]) => {
    expressions.push(`#${key} = :${key}`);
    names[`#${key}`] = key;
    values[`:${key}`] = value;
  });

  return {
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };
}
