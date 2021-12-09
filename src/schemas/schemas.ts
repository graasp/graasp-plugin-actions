
// schema for getting one item or member
const getOne = {
    querystring: {
      requestedSampleSize: { type: 'string', required: ['requestedSampleSize'] },
      view: { type: 'string', required: ['view'] }
    }
  };

export { getOne };