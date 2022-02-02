// global
import { sql, DatabaseTransactionConnectionType as TrxHandler } from 'slonik';
import { Action } from './interfaces/action';

/**
 * Database's first layer of abstraction for Actions
 */
export class ActionService {
  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    [
      'id',
      ['member_id', 'memberId'],
      ['member_type', 'memberType'],
      ['item_id', 'itemId'],
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
   * Create given action and return it.
   * @param action Action to create
   * @param transactionHandler Database transaction handler
   */
  async create(action: Action, transactionHandler: TrxHandler): Promise<Action> {
    return transactionHandler
      .query<Action>(
        sql`
        INSERT INTO "action" (
            "member_id",
            "member_type",
            "item_id",
            "item_type",
            "action_type",
            "view",
            "geolocation",
            "extra"
        )
        VALUES (
            ${action.memberId},
            ${action.memberType},
            ${action.itemId},
            ${action.itemType},
            ${action.actionType},
            ${action.view},
            ${sql.json(action.geolocation ?? null)},
            ${sql.json(action.extra)}
        )
        RETURNING ${ActionService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0]);
  }

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
        RETURNING ${ActionService.allColumns}
      `,
      )
      .then(({ rows }) => rows);
  }

  /**
   * Get actions matching the given `itemId` or `[]`, if none is found.
   * @param itemId ID of the item whose actions are retrieved
   * @param requestedSampleSize Number of actions to retrieve in random way
   * @param transactionHandler Database transaction handler
   */
  async getActionsByItemWithSample(
    itemId: string,
    requestedSampleSize: number,
    transactionHandler: TrxHandler,
  ): Promise<readonly Action[]> {
    return transactionHandler
      .query<Action>(
        sql`
        SELECT ${ActionService.allColumns} 
        FROM action
        WHERE "item_id" = ${itemId}
        ORDER BY RANDOM()
        LIMIT ${requestedSampleSize}
      `,
      )
      .then(({ rows }) => rows);
  }

  /**
   * Get actions matching the given `itemId` or `[]`, if none is found.
   * @param itemId ID of the item whose actions are retrieved
   * @param requestedSampleSize Number of actions to retrieve in random way
   * @param view Obtain actions only from a certain Graasp view
   * @param transactionHandler Database transaction handler
   */
  async getActionsByItemWithSampleAndView(
    itemId: string,
    requestedSampleSize: number,
    view: string,
    transactionHandler: TrxHandler,
  ): Promise<readonly Action[]> {
    return transactionHandler
      .query<Action>(
        sql`
        SELECT ${ActionService.allColumns} 
        FROM action
        WHERE "item_id" = ${itemId}
        AND "view" = ${view}
        ORDER BY RANDOM()
        LIMIT ${requestedSampleSize}
      `,
      )
      .then(({ rows }) => rows);
  }
}
