import { sql, DatabaseTransactionConnectionType as TrxHandler } from 'slonik';
import { DEFAULT_ACTIONS_SAMPLE_SIZE } from '../../constants/constants';
import { Action } from '../../interfaces/action';

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
            "item_path",
            "item_type",
            "action_type",
            "view",
            "geolocation",
            "extra"
        )
        VALUES (
            ${action.memberId},
            ${action.memberType},
            ${action.itemPath},
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
   * Get random actions matching the given itemPath and below
   * @param itemPath path of the item whose actions are retrieved
   * @param filters.sampleSize number of actions to retrieve
   * @param filters.view get actions only for a given view
   * @param transactionHandler database transaction handler
   */
  async getActionsByItem(
    itemPath: string,
    filters: { sampleSize?: number; view?: string },
    transactionHandler: TrxHandler,
  ): Promise<readonly Action[]> {
    const size = filters.sampleSize ?? DEFAULT_ACTIONS_SAMPLE_SIZE;
    const conditions = filters.view ? sql`AND view = ${filters.view}` : sql``;

    return transactionHandler
      .query<Action>(
        sql`
        SELECT ${ActionService.allColumns} 
        FROM action
        WHERE item_path <@ ${itemPath} ${conditions}
        ORDER BY RANDOM()
        LIMIT ${size}
      `,
      )
      .then(({ rows }) => rows);
  }
}
