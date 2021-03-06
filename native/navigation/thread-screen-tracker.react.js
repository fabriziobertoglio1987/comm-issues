// @flow

import * as React from 'react';
import { useDispatch } from 'react-redux';

import { updateThreadLastNavigatedActionType } from '../redux/action-types';
import { useActiveMessageList } from './nav-selectors';

const ThreadScreenTracker = React.memo<{||}>(() => {
  const activeThread = useActiveMessageList();
  const reduxDispatch = useDispatch();

  React.useEffect(() => {
    if (activeThread) {
      reduxDispatch({
        type: updateThreadLastNavigatedActionType,
        payload: {
          threadID: activeThread,
          time: Date.now(),
        },
      });
    }
  }, [activeThread, reduxDispatch]);

  return null;
});
ThreadScreenTracker.displayName = 'ThreadScreenTracker';

export default ThreadScreenTracker;
