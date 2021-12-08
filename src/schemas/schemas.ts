
// schema for getting one item or member
const getOne = {
    params: {idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { uuid: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
        } },
      },
      additionalProperties: false,
    }
  },
};

export { getOne };