import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

import { Action, CreateActionInput, ActionService as Service } from '@graasp/sdk';

/**
 * Database's first layer of abstraction for Actions
 */
export class ActionService implements Service {
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
  async create(action: CreateActionInput, transactionHandler: TrxHandler): Promise<Action> {
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
            ${action.itemPath ?? null},
            ${action.itemType ?? null},
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
}
