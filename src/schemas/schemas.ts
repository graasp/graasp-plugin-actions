
import S from 'fluent-json-schema';

export const uuid = S.string().pattern(
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);

export const idParam = S.object().prop('itemId', uuid).required(['itemId']);
// schema for getting one item or member
const getOne = {
    params: idParam,
    querystring: {
      requestedSampleSize: { type: 'string', required: ['requestedSampleSize'] },
      view: { type: 'string', required: ['view'] }
    }
  };

export { getOne };