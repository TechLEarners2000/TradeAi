export interface CorporateAction {
  symbol: string;
  companyName: string;
  exDate: string;
  recordDate: string;
  bcStartDate: string;
  purpose: string;
  actionType: 'DIVIDEND' | 'BONUS' | 'SPLIT' | 'BUYBACK' | 'RIGHTS' | 'OTHER';
  details: string;
  percentage: string;
}

export interface Announcement {
  symbol: string;
  companyName: string;
  date: string;
  title: string;
  category: string;
  subcategory: string;
  attachmentUrl: string;
  details: string;
}

export interface BoardMeeting {
  symbol: string;
  companyName: string;
  meetingDate: string;
  purpose: string;
  details: string;
}
