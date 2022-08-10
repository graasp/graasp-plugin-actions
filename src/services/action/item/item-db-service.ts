import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

import { Action } from '@graasp/sdk';

import { DEFAULT_ACTIONS_SAMPLE_SIZE } from '../../../constants/constants';

/**
 * Database's first layer of abstraction for Actions
 */
export class ItemActionService {
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
        SELECT ${ItemActionService.allColumns} 
        FROM action
        WHERE item_path <@ ${itemPath} ${conditions}
        ORDER BY RANDOM()
        LIMIT ${size}
      `,
      )
      .then(({ rows }) => rows);
  }
}
