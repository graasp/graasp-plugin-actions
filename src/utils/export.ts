import fs, { mkdirSync } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { TMP_FOLDER_PATH } from '../constants/constants';
import { onExportSuccessFunction, UploadArchiveFunction } from '../types';
import { BaseAnalytics } from '../services/action/base-analytics';

export const buildItemTmpFolder = (itemId: string): string => path.join(TMP_FOLDER_PATH, itemId);
export const buildActionFileName = (name: string, datetime: string): string =>
  `${name}_${datetime}.json`;

export const buildActionFilePath = (itemId: string, timestamp: number): string =>
  `actions/${itemId}/${timestamp}`;

export const createActionArchive = async (args: {
  itemId: string;
  views: string[];
  tmpFolder: string;
  baseAnalytics: BaseAnalytics;
  onSuccess: onExportSuccessFunction;
  uploadArchive: UploadArchiveFunction;
}): Promise<void> => {
  const { itemId, baseAnalytics, onSuccess, tmpFolder, uploadArchive, views } = args;

  // timestamp and datetime are used to build folder name and human readable filename
  const timestamp = Date.now();
  const datetime = timestamp.toString();
  const fileName = `${baseAnalytics.item.name}_${datetime}`;

  // create tmp dir
  const outputPath = path.join(tmpFolder, `${fileName}.zip`);
  const outputStream = fs.createWriteStream(outputPath);
  const archive = archiver('zip');
  archive.pipe(outputStream);

  archive.directory(fileName);

  try {
    const fileFolderPath = path.join(tmpFolder, fileName);
    mkdirSync(fileFolderPath);

    // create file for each view
    views.forEach((viewName) => {
      const actionsPerView = baseAnalytics.actions.filter(({ view }) => view === viewName);
      const filename = buildActionFileName(viewName, datetime);
      const filepath = path.join(fileFolderPath, filename);
      fs.writeFileSync(filepath, JSON.stringify(actionsPerView));
    });

    // create file for item
    // todo: add item tree data
    const filepath = path.join(fileFolderPath, buildActionFileName('item', datetime));
    fs.writeFileSync(filepath, JSON.stringify(baseAnalytics.item));

    // create file for the members
    const membersFilepath = path.join(fileFolderPath, buildActionFileName('members', datetime));
    fs.writeFileSync(membersFilepath, JSON.stringify(baseAnalytics.members));

    // create file for the memberships
    const iMembershipsPath = path.join(fileFolderPath, buildActionFileName('memberships', datetime));
    fs.writeFileSync(iMembershipsPath, JSON.stringify(baseAnalytics.itemMemberships));

    // add directory in archive
    archive.directory(fileFolderPath, fileName);
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
      await uploadArchive({ filepath: outputPath, itemId, timestamp });

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
