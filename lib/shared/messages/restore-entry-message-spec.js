// @flow

import invariant from 'invariant';

import { messageTypes } from '../../types/message-types';
import type { MessageInfo } from '../../types/message-types';
import type {
  RawRestoreEntryMessageInfo,
  RestoreEntryMessageData,
  RestoreEntryMessageInfo,
} from '../../types/messages/restore-entry';
import type { NotifTexts } from '../../types/notif-types';
import type { ThreadInfo } from '../../types/thread-types';
import type { RelativeUserInfo } from '../../types/user-types';
import { prettyDate } from '../../utils/date-utils';
import {
  robotextToRawString,
  robotextForMessageInfo,
  removeCreatorAsViewer,
} from '../message-utils';
import { stringForUser } from '../user-utils';
import type {
  MessageSpec,
  MessageTitleParam,
  NotificationTextsParams,
} from './message-spec';
import { assertSingleMessageInfo } from './utils';

export const restoreEntryMessageSpec: MessageSpec<
  RestoreEntryMessageData,
  RawRestoreEntryMessageInfo,
  RestoreEntryMessageInfo,
> = Object.freeze({
  messageContent(data: RestoreEntryMessageData): string {
    return JSON.stringify({
      entryID: data.entryID,
      date: data.date,
      text: data.text,
    });
  },

  messageTitle({
    messageInfo,
    threadInfo,
    viewerContext,
  }: MessageTitleParam<RestoreEntryMessageInfo>) {
    let validMessageInfo: RestoreEntryMessageInfo = (messageInfo: RestoreEntryMessageInfo);
    if (viewerContext === 'global_viewer') {
      validMessageInfo = removeCreatorAsViewer(validMessageInfo);
    }
    return robotextToRawString(
      robotextForMessageInfo(validMessageInfo, threadInfo),
    );
  },

  rawMessageInfoFromRow(row: Object): RawRestoreEntryMessageInfo {
    const content = JSON.parse(row.content);
    return {
      type: messageTypes.RESTORE_ENTRY,
      id: row.id.toString(),
      threadID: row.threadID.toString(),
      time: row.time,
      creatorID: row.creatorID.toString(),
      entryID: content.entryID,
      date: content.date,
      text: content.text,
    };
  },

  createMessageInfo(
    rawMessageInfo: RawRestoreEntryMessageInfo,
    creator: RelativeUserInfo,
  ): RestoreEntryMessageInfo {
    return {
      type: messageTypes.RESTORE_ENTRY,
      id: rawMessageInfo.id,
      threadID: rawMessageInfo.threadID,
      creator,
      time: rawMessageInfo.time,
      entryID: rawMessageInfo.entryID,
      date: rawMessageInfo.date,
      text: rawMessageInfo.text,
    };
  },

  rawMessageInfoFromMessageData(
    messageData: RestoreEntryMessageData,
    id: string,
  ): RawRestoreEntryMessageInfo {
    return { ...messageData, id };
  },

  robotext(messageInfo: RestoreEntryMessageInfo, creator: string): string {
    const date = prettyDate(messageInfo.date);
    return (
      `${creator} restored an event scheduled for ${date}: ` +
      `"${messageInfo.text}"`
    );
  },

  notificationTexts(
    messageInfos: $ReadOnlyArray<MessageInfo>,
    threadInfo: ThreadInfo,
    params: NotificationTextsParams,
  ): NotifTexts {
    const messageInfo = assertSingleMessageInfo(messageInfos);
    invariant(
      messageInfo.type === messageTypes.RESTORE_ENTRY,
      'messageInfo should be messageTypes.RESTORE_ENTRY!',
    );
    const prefix = stringForUser(messageInfo.creator);
    const body =
      `restored an event in ${params.notifThreadName(threadInfo)} ` +
      `scheduled for ${prettyDate(messageInfo.date)}: "${messageInfo.text}"`;
    const merged = `${prefix} ${body}`;
    return {
      merged,
      title: threadInfo.uiName,
      body,
      prefix,
    };
  },

  generatesNotifs: true,
});
