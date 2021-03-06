// @flow

export type ActivityUpdate = {|
  +focus: boolean,
  +threadID: string,
  +latestMessage: ?string,
|};

export type UpdateActivityRequest = {|
  +updates: $ReadOnlyArray<ActivityUpdate>,
|};

export type UpdateActivityResult = {|
  +unfocusedToUnread: $ReadOnlyArray<string>,
|};

export type ActivityUpdateSuccessPayload = {|
  +activityUpdates: $ReadOnlyArray<ActivityUpdate>,
  +result: UpdateActivityResult,
|};

export const queueActivityUpdatesActionType = 'QUEUE_ACTIVITY_UPDATES';
export type QueueActivityUpdatesPayload = {|
  +activityUpdates: $ReadOnlyArray<ActivityUpdate>,
|};

export type SetThreadUnreadStatusRequest = {|
  +unread: boolean,
  +threadID: string,
  +latestMessage: ?string,
|};
export type SetThreadUnreadStatusResult = {|
  +resetToUnread: boolean,
|};
export type SetThreadUnreadStatusPayload = {|
  ...SetThreadUnreadStatusResult,
  +threadID: string,
|};
