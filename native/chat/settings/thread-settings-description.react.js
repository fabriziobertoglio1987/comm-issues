// @flow

import invariant from 'invariant';
import * as React from 'react';
import { Text, Alert, ActivityIndicator, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import {
  changeThreadSettingsActionTypes,
  changeThreadSettings,
} from 'lib/actions/thread-actions';
import { createLoadingStatusSelector } from 'lib/selectors/loading-selectors';
import { threadHasPermission } from 'lib/shared/thread-utils';
import type { LoadingStatus } from 'lib/types/loading-types';
import {
  type ThreadInfo,
  threadPermissions,
  type ChangeThreadSettingsPayload,
  type UpdateThreadRequest,
} from 'lib/types/thread-types';
import {
  type DispatchActionPromise,
  useServerCall,
  useDispatchActionPromise,
} from 'lib/utils/action-utils';

import Button from '../../components/button.react';
import EditSettingButton from '../../components/edit-setting-button.react';
import { useSelector } from '../../redux/redux-utils';
import { type Colors, useStyles, useColors } from '../../themes/colors';
import type {
  LayoutEvent,
  ContentSizeChangeEvent,
} from '../../types/react-native';
import SaveSettingButton from './save-setting-button.react';
import {
  ThreadSettingsCategoryHeader,
  ThreadSettingsCategoryFooter,
} from './thread-settings-category.react';

type BaseProps = {|
  +threadInfo: ThreadInfo,
  +descriptionEditValue: ?string,
  +setDescriptionEditValue: (value: ?string, callback?: () => void) => void,
  +descriptionTextHeight: ?number,
  +setDescriptionTextHeight: (number: number) => void,
  +canChangeSettings: boolean,
|};
type Props = {|
  ...BaseProps,
  // Redux state
  +loadingStatus: LoadingStatus,
  +colors: Colors,
  +styles: typeof unboundStyles,
  // Redux dispatch functions
  +dispatchActionPromise: DispatchActionPromise,
  // async functions that hit server APIs
  +changeThreadSettings: (
    update: UpdateThreadRequest,
  ) => Promise<ChangeThreadSettingsPayload>,
|};
class ThreadSettingsDescription extends React.PureComponent<Props> {
  textInput: ?React.ElementRef<typeof TextInput>;

  render() {
    if (
      this.props.descriptionEditValue !== null &&
      this.props.descriptionEditValue !== undefined
    ) {
      let button;
      if (this.props.loadingStatus !== 'loading') {
        button = <SaveSettingButton onPress={this.onSubmit} />;
      } else {
        button = (
          <ActivityIndicator
            size="small"
            color={this.props.colors.panelForegroundSecondaryLabel}
          />
        );
      }
      const textInputStyle = {};
      if (
        this.props.descriptionTextHeight !== undefined &&
        this.props.descriptionTextHeight !== null
      ) {
        textInputStyle.height = this.props.descriptionTextHeight;
      }
      return (
        <View>
          <ThreadSettingsCategoryHeader type="full" title="Description" />
          <View style={this.props.styles.row}>
            <TextInput
              style={[this.props.styles.text, textInputStyle]}
              value={this.props.descriptionEditValue}
              onChangeText={this.props.setDescriptionEditValue}
              multiline={true}
              autoFocus={true}
              selectTextOnFocus={true}
              onBlur={this.onSubmit}
              editable={this.props.loadingStatus !== 'loading'}
              onContentSizeChange={this.onTextInputContentSizeChange}
              ref={this.textInputRef}
            />
            {button}
          </View>
          <ThreadSettingsCategoryFooter type="full" />
        </View>
      );
    }

    if (this.props.threadInfo.description) {
      return (
        <View>
          <ThreadSettingsCategoryHeader type="full" title="Description" />
          <View style={this.props.styles.row}>
            <Text style={this.props.styles.text} onLayout={this.onLayoutText}>
              {this.props.threadInfo.description}
            </Text>
            <EditSettingButton
              onPress={this.onPressEdit}
              canChangeSettings={this.props.canChangeSettings}
              key="editButton"
            />
          </View>
          <ThreadSettingsCategoryFooter type="full" />
        </View>
      );
    }

    const canEditThread = threadHasPermission(
      this.props.threadInfo,
      threadPermissions.EDIT_THREAD,
    );
    const { panelIosHighlightUnderlay } = this.props.colors;
    if (canEditThread) {
      return (
        <View>
          <ThreadSettingsCategoryHeader type="outline" title="Description" />
          <View style={this.props.styles.outlineCategory}>
            <Button
              onPress={this.onPressEdit}
              style={this.props.styles.addDescriptionButton}
              iosFormat="highlight"
              iosHighlightUnderlayColor={panelIosHighlightUnderlay}
            >
              <Text style={this.props.styles.addDescriptionText}>
                Add a description...
              </Text>
              <Icon
                name="pencil"
                size={16}
                style={this.props.styles.editIcon}
              />
            </Button>
          </View>
          <ThreadSettingsCategoryFooter type="outline" />
        </View>
      );
    }

    return null;
  }

  textInputRef = (textInput: ?React.ElementRef<typeof TextInput>) => {
    this.textInput = textInput;
  };

  onLayoutText = (event: LayoutEvent) => {
    this.props.setDescriptionTextHeight(event.nativeEvent.layout.height);
  };

  onTextInputContentSizeChange = (event: ContentSizeChangeEvent) => {
    this.props.setDescriptionTextHeight(event.nativeEvent.contentSize.height);
  };

  onPressEdit = () => {
    this.props.setDescriptionEditValue(this.props.threadInfo.description);
  };

  onSubmit = () => {
    invariant(
      this.props.descriptionEditValue !== null &&
        this.props.descriptionEditValue !== undefined,
      'should be set',
    );
    const description = this.props.descriptionEditValue.trim();

    if (description === this.props.threadInfo.description) {
      this.props.setDescriptionEditValue(null);
      return;
    }

    const editDescriptionPromise = this.editDescription(description);
    this.props.dispatchActionPromise(
      changeThreadSettingsActionTypes,
      editDescriptionPromise,
      {
        customKeyName: `${changeThreadSettingsActionTypes.started}:description`,
      },
    );
    editDescriptionPromise.then(() => {
      this.props.setDescriptionEditValue(null);
    });
  };

  async editDescription(newDescription: string) {
    try {
      return await this.props.changeThreadSettings({
        threadID: this.props.threadInfo.id,
        changes: { description: newDescription },
      });
    } catch (e) {
      Alert.alert(
        'Unknown error',
        'Uhh... try again?',
        [{ text: 'OK', onPress: this.onErrorAcknowledged }],
        { cancelable: false },
      );
      throw e;
    }
  }

  onErrorAcknowledged = () => {
    this.props.setDescriptionEditValue(
      this.props.threadInfo.description,
      () => {
        invariant(this.textInput, 'textInput should be set');
        this.textInput.focus();
      },
    );
  };
}

const unboundStyles = {
  addDescriptionButton: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  addDescriptionText: {
    color: 'panelForegroundTertiaryLabel',
    flex: 1,
    fontSize: 16,
  },
  editIcon: {
    color: 'panelForegroundTertiaryLabel',
    paddingLeft: 10,
    textAlign: 'right',
  },
  outlineCategory: {
    backgroundColor: 'panelSecondaryForeground',
    borderColor: 'panelSecondaryForegroundBorder',
    borderRadius: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginLeft: -1,
    marginRight: -1,
  },
  row: {
    backgroundColor: 'panelForeground',
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  text: {
    color: 'panelForegroundSecondaryLabel',
    flex: 1,
    fontFamily: 'Arial',
    fontSize: 16,
    margin: 0,
    padding: 0,
    borderBottomColor: 'transparent',
  },
};

const loadingStatusSelector = createLoadingStatusSelector(
  changeThreadSettingsActionTypes,
  `${changeThreadSettingsActionTypes.started}:description`,
);

export default React.memo<BaseProps>(
  function ConnectedThreadSettingsDescription(props: BaseProps) {
    const loadingStatus = useSelector(loadingStatusSelector);
    const colors = useColors();
    const styles = useStyles(unboundStyles);

    const dispatchActionPromise = useDispatchActionPromise();
    const callChangeThreadSettings = useServerCall(changeThreadSettings);
    return (
      <ThreadSettingsDescription
        {...props}
        loadingStatus={loadingStatus}
        colors={colors}
        styles={styles}
        dispatchActionPromise={dispatchActionPromise}
        changeThreadSettings={callChangeThreadSettings}
      />
    );
  },
);
