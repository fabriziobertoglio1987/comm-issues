// @flow

import type {
  ThreadSubscription,
  SubscriptionUpdateRequest,
} from 'lib/types/subscription-types';
import type { Viewer } from '../session/viewer';

import { ServerError } from 'lib/utils/errors';

import { dbQuery, SQL } from '../database';

async function userSubscriptionUpdater(
  viewer: Viewer,
  update: SubscriptionUpdateRequest,
): Promise<ThreadSubscription> {
  const query = SQL`
    SELECT subscription
    FROM memberships
    WHERE user = ${viewer.id} AND thread = ${update.threadID} AND role != 0
  `;
  const [ result ] = await dbQuery(query);
  if (result.length === 0) {
    throw new ServerError('not_member');
  }
  const row = result[0];

  const newSubscription = {
    ...row.subscription,
    ...update.updatedFields,
  };
  const saveQuery = SQL`
    UPDATE memberships
    SET subscription = ${JSON.stringify(newSubscription)}
    WHERE user = ${viewer.id} AND thread = ${update.threadID}
  `;
  await dbQuery(saveQuery);

  return newSubscription;
}

export {
  userSubscriptionUpdater,
};
