// @flow

import invariant from 'invariant';
import * as React from 'react';

import { type ChatMessageInfoItem } from 'lib/selectors/chat-selectors';
import { messageTypes } from 'lib/types/message-types';
import { type ThreadInfo } from 'lib/types/thread-types';
import { longAbsoluteDate } from 'lib/utils/date-utils';

import css from './chat-message-list.css';
import MultimediaMessage from './multimedia-message.react';
import {
  type OnMessagePositionWithContainerInfo,
  type MessagePositionInfo,
} from './position-types';
import RobotextMessage from './robotext-message.react';
import TextMessage from './text-message.react';

type Props = {|
  item: ChatMessageInfoItem,
  threadInfo: ThreadInfo,
  setMouseOverMessagePosition: (
    messagePositionInfo: MessagePositionInfo,
  ) => void,
  mouseOverMessagePosition: ?OnMessagePositionWithContainerInfo,
  setModal: (modal: ?React.Node) => void,
  timeZone: ?string,
|};
class Message extends React.PureComponent<Props> {
  render() {
    const { item, timeZone } = this.props;

    let conversationHeader = null;
    if (item.startsConversation) {
      conversationHeader = (
        <div className={css.conversationHeader}>
          {longAbsoluteDate(item.messageInfo.time, timeZone)}
        </div>
      );
    }
    let message;
    if (item.messageInfo.type === messageTypes.TEXT) {
      message = (
        <TextMessage
          item={item}
          threadInfo={this.props.threadInfo}
          setMouseOverMessagePosition={this.props.setMouseOverMessagePosition}
          mouseOverMessagePosition={this.props.mouseOverMessagePosition}
        />
      );
    } else if (
      item.messageInfo.type === messageTypes.IMAGES ||
      item.messageInfo.type === messageTypes.MULTIMEDIA
    ) {
      message = (
        <MultimediaMessage
          item={item}
          threadInfo={this.props.threadInfo}
          setMouseOverMessagePosition={this.props.setMouseOverMessagePosition}
          mouseOverMessagePosition={this.props.mouseOverMessagePosition}
          setModal={this.props.setModal}
        />
      );
    } else {
      invariant(item.robotext, "Flow can't handle our fancy types :(");
      message = (
        <RobotextMessage
          item={item}
          threadInfo={this.props.threadInfo}
          setMouseOverMessagePosition={this.props.setMouseOverMessagePosition}
          mouseOverMessagePosition={this.props.mouseOverMessagePosition}
        />
      );
    }
    return (
      <div className={css.message}>
        {conversationHeader}
        {message}
      </div>
    );
  }
}

export default Message;
