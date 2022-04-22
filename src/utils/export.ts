import fs, { mkdirSync } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { TMP_FOLDER_PATH } from '../constants/constants';
import { BaseAnalytics } from '../services/action/base-analytics';
import { CannotWriteFileError } from './errors';

export const buildItemTmpFolder = (itemId: string): string => path.join(TMP_FOLDER_PATH, itemId);
export const buildActionFileName = (name: string, datetime: string): string =>
  `${name}_${datetime}.json`;

export const buildActionFilePath = (itemId: string, datetime: string): string =>
  `actions/${itemId}/${datetime}`;

export const buildArchiveDateAsName = (timestamp: Date): string => timestamp.toISOString();

export interface ExportActionsInArchiveOutput {
  timestamp: Date;
  filepath: string;
}
export const exportActionsInArchive = async (args: {
  views: string[];
  storageFolder: string;
  baseAnalytics: BaseAnalytics;
}): Promise<ExportActionsInArchiveOutput> => {
  const { baseAnalytics, storageFolder, views } = args;

  // timestamp and datetime are used to build folder name and human readable filename
  const timestamp = new Date();
  const archiveDate = buildArchiveDateAsName(timestamp);
  const fileName = `${baseAnalytics.item.name}_${archiveDate}`;

  // create tmp dir
  const outputPath = path.join(storageFolder, `${fileName}.zip`);
  const outputStream = fs.createWriteStream(outputPath);
  const archive = archiver('zip');
  archive.pipe(outputStream);

  archive.directory(fileName);

  try {
    const fileFolderPath = path.join(storageFolder, archiveDate);
    mkdirSync(fileFolderPath);

    // create file for each view
    views.forEach((viewName) => {
      const actionsPerView = baseAnalytics.actions.filter(({ view }) => view === viewName);
      const filename = buildActionFileName(`actions_${viewName}`, archiveDate);
      const viewFilepath = path.join(fileFolderPath, filename);
      fs.writeFileSync(viewFilepath, JSON.stringify(actionsPerView));
    });

    // create file for item
    // todo: add item tree data
    const itemFilepath = path.join(fileFolderPath, buildActionFileName('item', archiveDate));
    fs.writeFileSync(itemFilepath, JSON.stringify(baseAnalytics.item));

    // create file for the members
    const membersFilepath = path.join(fileFolderPath, buildActionFileName('members', archiveDate));
    fs.writeFileSync(membersFilepath, JSON.stringify(baseAnalytics.members));

    // create file for the memberships
    const iMembershipsPath = path.join(
      fileFolderPath,
      buildActionFileName('memberships', archiveDate),
    );
    fs.writeFileSync(iMembershipsPath, JSON.stringify(baseAnalytics.itemMemberships));

    // add directory in archive
    archive.directory(fileFolderPath, fileName);
  } catch (e) {
    throw new CannotWriteFileError(e);
  }

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  // the archive is ready
  const promise = new Promise<ExportActionsInArchiveOutput>((resolve, reject) => {
    outputStream.on('error', (err) => {
      reject(err);
    });

    outputStream.on('close', async () => {
      resolve({
        timestamp,
        filepath: outputPath,
      });
    });
  });

  archive.finalize();

  return promise;
};
