import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { TMP_FOLDER_PATH } from '../constants/constants';
import { Action } from '../interfaces/action';

export const buildItemTmpFolder = (itemId) => path.join(TMP_FOLDER_PATH, itemId);
export const buildActionFileName = (timestamp, view): string => `${view}_${timestamp}.json`;

export const buildActionFilePath = (itemId, timestamp) => `actions/${itemId}/${timestamp}`;

export const createActionArchive = async ({
  itemId,
  getActions,
  onSuccess,
  tmpFolder,
  uploadArchive,
}): Promise<void> => {
  // create tmp dir
  const timestamp = Date.now();
  const outputStream = fs.createWriteStream(path.join(tmpFolder, `${itemId}.zip`));
  const archive = archiver('zip');
  archive.pipe(outputStream);

  const actions = (await getActions()) as Action[][];

  // create file for each view
  try {
    actions.forEach((content) => {
      // create file only if content is not empty
      if (content.length) {
        const view = content[0].view;
        const filename = buildActionFileName(timestamp, view);
        const filepath = path.join(tmpFolder, filename);
        fs.writeFileSync(filepath, JSON.stringify(content));
        archive.file(filepath);
      }
    });
  } catch (e) {
    console.log('Cannot write file ', e);
  }

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  // the archive is ready
  const promise = new Promise((resolve, reject) => {
    outputStream.on('error', (err) => {
      reject(err);
    });

    outputStream.on('close', async () => {
      await uploadArchive();

      // callback
      if (onSuccess) {
        await onSuccess({ itemId, timestamp });
      }

      resolve('success');
    });
  });

  archive.finalize();

  await promise;
};
