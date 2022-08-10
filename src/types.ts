import { BaseAnalytics } from './services/action/base-analytics';

export type onExportSuccessFunction = (args: {
  itemId: string;
  dateString: string;
  timestamp: Date;
  filepath: string;
}) => void;
export type GetBaseAnalyticsForViewsFunction = () => BaseAnalytics[];
