import { v4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { CLIENT_HOSTS, createDummyAction } from '../../test/constants';
import { createActionArchive } from './export';
import { BaseAnalytics } from '../services/action/base-analytics';
import { Action } from '../interfaces/action';
import { Item } from 'graasp';
import { VIEW_UNKNOWN_NAME } from '../constants/constants';

const itemId = v4();
const views = [...CLIENT_HOSTS.map(({ name }) => name), VIEW_UNKNOWN_NAME];
const actions: Action[] = [createDummyAction(), createDummyAction(), createDummyAction()];
const baseAnalytics = new BaseAnalytics({
  actions,
  members: [],
  itemMemberships: [],
  item: { id: itemId } as unknown as Item,
  metadata: { numActionsRetrieved: 5, requestedSampleSize: 5 },
});

const tmpFolder = path.join(__dirname, 'tmp');
fs.mkdirSync(tmpFolder, { recursive: true });

describe('createActionArchive', () => {
  it('Create archive successfully', async () => {
    const onSuccess = jest.fn();
    const uploadArchive = jest.fn();
    await createActionArchive({
      itemId,
      baseAnalytics,
      onSuccess,
      tmpFolder,
      uploadArchive,
      views,
    });

    // call on success callback
    expect(onSuccess).toHaveBeenCalled();
  });

});
