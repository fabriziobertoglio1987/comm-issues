// @flow

import {
  type MediaInfo,
  mediaInfoPropType,
  type Dimensions,
  dimensionsPropType,
} from 'lib/types/media-types';
import {
  type VerticalBounds,
  verticalBoundsPropType,
  type LayoutCoordinates,
  layoutCoordinatesPropType,
} from '../types/lightbox-types';
import type {
  NavigationScreenProp,
  NavigationLeafRoute,
} from 'react-navigation';
import type { RawMessageInfo } from 'lib/types/message-types';
import type { AppState } from '../redux/redux-setup';

import * as React from 'react';
import Animated from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';

import { connect } from 'lib/utils/redux-utils';

import {
  type ChatInputState,
  chatInputStatePropType,
  withChatInputState,
} from './chat-input-state';
import InlineMultimedia from './inline-multimedia.react';
import { multimediaMessageBorderRadius } from './multimedia-message.react';
import { getRoundedContainerStyle } from './rounded-message-container.react';
import Timestamp from './timestamp.react';
import { dimensionsSelector } from '../selectors/dimension-selectors';

const { Value } = Animated;

type NavProp = NavigationScreenProp<{|
  ...NavigationLeafRoute,
  params: {
    // Tooltip props
    initialCoordinates: LayoutCoordinates,
    verticalBounds: VerticalBounds,
    location?: 'above' | 'below',
    margin?: number,
    // Custom props
    mediaInfo: MediaInfo,
    verticalOffset: number,
  },
|}>;

type Props = {
  navigation: NavProp,
  progress: Value,
  // Redux state
  rawMessageInfo: ?RawMessageInfo,
  screenDimensions: Dimensions,
  // withChatInputState
  chatInputState: ?ChatInputState,
};
class MultimediaTooltipButton extends React.PureComponent<Props> {

  static propTypes = {
    navigation: PropTypes.shape({
      state: PropTypes.shape({
        params: PropTypes.shape({
          initialCoordinates: layoutCoordinatesPropType.isRequired,
          verticalBounds: verticalBoundsPropType.isRequired,
          location: PropTypes.oneOf([ 'above', 'below' ]),
          margin: PropTypes.number,
          mediaInfo: mediaInfoPropType.isRequired,
          verticalOffset: PropTypes.number.isRequired,
        }).isRequired,
      }).isRequired,
      goBack: PropTypes.func.isRequired,
    }).isRequired,
    progress: PropTypes.object.isRequired,
    rawMessageInfo: PropTypes.object,
    screenDimensions: dimensionsPropType.isRequired,
    chatInputState: chatInputStatePropType,
  };

  get timestampStyle() {
    const {
      initialCoordinates,
      verticalOffset,
    } = this.props.navigation.state.params;
    const bottom = initialCoordinates.height + verticalOffset;
    return {
      opacity: this.props.progress,
      position: 'absolute',
      left: -initialCoordinates.x,
      width: this.props.screenDimensions.width,
      bottom,
    };
  }

  render() {
    const { chatInputState } = this.props;
    const { mediaInfo } = this.props.navigation.state.params;

    const { id: mediaID, messageID } = mediaInfo;
    const pendingUploads = chatInputState
      && chatInputState.pendingUploads
      && chatInputState.pendingUploads[messageID];
    const pendingUpload = pendingUploads && pendingUploads[mediaID];
    const postInProgress = !!pendingUploads;

    const roundedStyle = getRoundedContainerStyle(
      mediaInfo.corners,
      multimediaMessageBorderRadius,
    );

    let timestamp = null;
    if (this.props.rawMessageInfo) {
      const { time } = this.props.rawMessageInfo;
      timestamp = (
        <Animated.View style={this.timestampStyle}>
          <Timestamp time={time} color="light" />
        </Animated.View>
      );
    }

    return (
      <React.Fragment>
        {timestamp}
        <View style={[ styles.media, roundedStyle ]}>
          <InlineMultimedia
            mediaInfo={mediaInfo}
            onPress={this.onPress}
            onLongPress={this.onPress}
            postInProgress={postInProgress}
            pendingUpload={pendingUpload}
          />
        </View>
      </React.Fragment>
    );
  }

  onPress = () => {
    this.props.navigation.goBack();
  }

}

const styles = StyleSheet.create({
  media: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default connect(
  (state: AppState, ownProps: { navigation: NavProp }) => {
    const { messageID } = ownProps.navigation.state.params.mediaInfo;
    const rawMessageInfo = state.messageStore.messages[messageID];
    return {
      rawMessageInfo,
      screenDimensions: dimensionsSelector(state),
    };
  },
)(withChatInputState(MultimediaTooltipButton));
