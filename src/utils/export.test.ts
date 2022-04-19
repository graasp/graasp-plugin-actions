import { v4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { MOCK_ALL_VIEWS_ACTIONS } from '../../test/constants';
import { createActionArchive } from './export';

const tmpFolder = path.join(__dirname, 'tmp');
fs.mkdirSync(tmpFolder, { recursive: true });

describe('createActionArchive', () => {
  it('Create archive successfully', async () => {
    const onSuccess = jest.fn();
    const itemId = v4();
    const getActions = async () => MOCK_ALL_VIEWS_ACTIONS;
    const uploadArchive = jest.fn();
    await createActionArchive({ itemId, getActions, onSuccess, tmpFolder, uploadArchive });

    // call on success callback
    expect(onSuccess).toHaveBeenCalled();
  });

  it('Does not create file if content is empty', async () => {
    const writeFileSpy = jest.spyOn(fs, 'writeFileSync');
    const onSuccess = jest.fn();
    const itemId = v4();
    const actions = [...MOCK_ALL_VIEWS_ACTIONS, []];
    const getActions = async () => actions;
    const uploadArchive = jest.fn();
    await createActionArchive({ itemId, getActions, onSuccess, tmpFolder, uploadArchive });

    // call on success callback
    expect(onSuccess).toHaveBeenCalled();
    expect(writeFileSpy).toHaveBeenCalledTimes(actions.length - 1);
  });
});
