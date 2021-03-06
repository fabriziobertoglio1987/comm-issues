// @flow

import * as React from 'react';
import { Text } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { threadTypeDescriptions } from 'lib/shared/thread-utils';
import { type ThreadInfo, threadTypes } from 'lib/types/thread-types';

import Button from '../../components/button.react';
import Modal from '../../components/modal.react';
import type { RootNavigationProp } from '../../navigation/root-navigator.react';
import type { NavigationRoute } from '../../navigation/route-names';
import { ComposeThreadRouteName } from '../../navigation/route-names';
import { type Colors, useStyles, useColors } from '../../themes/colors';

export type ComposeSubthreadModalParams = {|
  presentedFrom: string,
  threadInfo: ThreadInfo,
|};

type BaseProps = {|
  +navigation: RootNavigationProp<'ComposeSubthreadModal'>,
  +route: NavigationRoute<'ComposeSubthreadModal'>,
|};
type Props = {|
  ...BaseProps,
  +colors: Colors,
  +styles: typeof unboundStyles,
|};
class ComposeSubthreadModal extends React.PureComponent<Props> {
  render() {
    return (
      <Modal modalStyle={this.props.styles.modal}>
        <Text style={this.props.styles.visibility}>Thread type</Text>
        <Button style={this.props.styles.option} onPress={this.onPressOpen}>
          <Icon
            name="public"
            size={32}
            style={this.props.styles.visibilityIcon}
          />
          <Text style={this.props.styles.optionText}>Open</Text>
          <Text style={this.props.styles.optionExplanation}>
            {threadTypeDescriptions[threadTypes.COMMUNITY_OPEN_SUBTHREAD]}
          </Text>
          <IonIcon
            name="ios-arrow-forward"
            size={20}
            style={this.props.styles.forwardIcon}
          />
        </Button>
        <Button style={this.props.styles.option} onPress={this.onPressSecret}>
          <Icon
            name="lock-outline"
            size={32}
            style={this.props.styles.visibilityIcon}
          />
          <Text style={this.props.styles.optionText}>Secret</Text>
          <Text style={this.props.styles.optionExplanation}>
            {threadTypeDescriptions[threadTypes.COMMUNITY_SECRET_SUBTHREAD]}
          </Text>
          <IonIcon
            name="ios-arrow-forward"
            size={20}
            style={this.props.styles.forwardIcon}
          />
        </Button>
      </Modal>
    );
  }

  onPressOpen = () => {
    const threadInfo = this.props.route.params.threadInfo;
    this.props.navigation.navigate({
      name: ComposeThreadRouteName,
      params: {
        threadType: threadTypes.COMMUNITY_OPEN_SUBTHREAD,
        parentThreadInfo: threadInfo,
      },
      key:
        `${ComposeThreadRouteName}|` +
        `${threadInfo.id}|${threadTypes.COMMUNITY_OPEN_SUBTHREAD}`,
    });
  };

  onPressSecret = () => {
    const threadInfo = this.props.route.params.threadInfo;
    this.props.navigation.navigate({
      name: ComposeThreadRouteName,
      params: {
        threadType: threadTypes.COMMUNITY_SECRET_SUBTHREAD,
        parentThreadInfo: threadInfo,
      },
      key:
        `${ComposeThreadRouteName}|` +
        `${threadInfo.id}|${threadTypes.COMMUNITY_SECRET_SUBTHREAD}`,
    });
  };
}

const unboundStyles = {
  forwardIcon: {
    color: 'link',
    paddingLeft: 10,
  },
  modal: {
    flex: 0,
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  optionExplanation: {
    color: 'modalBackgroundLabel',
    flex: 1,
    fontSize: 14,
    paddingLeft: 20,
    textAlign: 'center',
  },
  optionText: {
    color: 'modalBackgroundLabel',
    fontSize: 20,
    paddingLeft: 5,
  },
  visibility: {
    color: 'modalBackgroundLabel',
    fontSize: 24,
    textAlign: 'center',
  },
  visibilityIcon: {
    color: 'modalBackgroundLabel',
    paddingRight: 3,
  },
};

export default React.memo<BaseProps>(function ConnectedComposeSubthreadModal(
  props: BaseProps,
) {
  const styles = useStyles(unboundStyles);
  const colors = useColors();

  return <ComposeSubthreadModal {...props} styles={styles} colors={colors} />;
});
