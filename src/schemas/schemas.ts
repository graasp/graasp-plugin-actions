
import S from 'fluent-json-schema';

export const uuid = S.string().pattern(
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);

export const id = S.object().prop('id', uuid).required(['id']);

// schema for getting item analytics with view and requestedSampleSize query parameters
const getOne = {
  params: id,
  querystring: {
    requestedSampleSize: { type: 'string', required: ['requestedSampleSize'] },
    view: { type: 'string', required: ['view'] }
  }
};

// schema for removing all actions of a member
const getOneDeleteActions = {
  params: id,
};

export { getOne, getOneDeleteActions };