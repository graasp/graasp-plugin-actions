import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

import { Action } from '@graasp/sdk';

/**
 * Database's first layer of abstraction for Actions
 */
export class MemberActionService {
  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    [
      'id',
      ['member_id', 'memberId'],
      ['member_type', 'memberType'],
      ['item_path', 'itemPath'],
      ['item_type', 'itemType'],
      ['action_type', 'actionType'],
      'view',
      'geolocation',
      'extra',
      ['created_at', 'createdAt'],
    ].map((c) =>
      !Array.isArray(c)
        ? sql.identifier([c])
        : sql.join(
            c.map((cwa) => sql.identifier([cwa])),
            sql` AS `,
          ),
    ),
    sql`, `,
  );

  /**
   * Delete actions matching the given `memberId`. Return actions, or `null`, if delete has no effect.
   * @param memberId ID of the member whose actions are deleted
   * @param transactionHandler Database transaction handler
   */
  async deleteActionsByUser(
    memberId: string,
    transactionHandler: TrxHandler,
  ): Promise<readonly Action[]> {
    return transactionHandler
      .query<Action>(
        sql`
        DELETE FROM "action"
        WHERE "member_id" = ${memberId}
        RETURNING ${MemberActionService.allColumns}
      `,
      )
      .then(({ rows }) => rows);
  }
}
