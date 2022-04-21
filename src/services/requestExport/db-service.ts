// global
import { sql, DatabaseTransactionConnectionType as TrxHandler } from 'slonik';
import { RequestExport } from '../../interfaces/requestExport';

/**
 * Database's first layer of abstraction for Actions
 */
export class RequestExportService {
  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    ['id', ['member_id', 'memberId'], ['item_id', 'itemId'], ['created_at', 'createdAt']].map((c) =>
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
   * Create given request export and return it.
   * @param requestExport RequestExport to create
   * @param transactionHandler Database transaction handler
   */
  async create(
    requestExport: Partial<RequestExport>,
    transactionHandler: TrxHandler,
  ): Promise<RequestExport> {
    return transactionHandler
      .query<RequestExport>(
        sql`
        INSERT INTO "action_request_export" (
            "member_id",
            "item_id",
            "created_at"
        )
        VALUES (
            ${requestExport.memberId},
            ${requestExport.itemId},
            to_timestamp(${requestExport.createdAt}/ 1000.0),
        )
        RETURNING ${RequestExportService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0]);
  }

  /**
   * Get request export given item id and member id
   * @param requestExport RequestExport to create
   * @param transactionHandler Database transaction handler
   */
  async get(
    { memberId, itemId }: Partial<RequestExport>,
    transactionHandler: TrxHandler,
  ): Promise<RequestExport> {
    return transactionHandler
      .query<RequestExport>(
        sql`
        SELECT ${RequestExportService.allColumns}
        WHERE 
          member_id='${memberId}' 
          AND 
          item_id='${itemId}'
      `,
      )
      .then(({ rows }) => rows[0]);
  }
}
