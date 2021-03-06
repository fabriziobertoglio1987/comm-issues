// @flow

import invariant from 'invariant';
import * as React from 'react';
import { View, Text, Platform } from 'react-native';

import { useStyles } from '../../themes/colors';

export type CategoryType = 'full' | 'outline' | 'unpadded';
type HeaderProps = {|
  +type: CategoryType,
  +title: string,
|};
function ThreadSettingsCategoryHeader(props: HeaderProps) {
  const styles = useStyles(unboundStyles);
  let contentStyle, paddingStyle;
  if (props.type === 'full') {
    contentStyle = styles.fullHeader;
    paddingStyle = styles.fullHeaderPadding;
  } else if (props.type === 'outline') {
    // nothing
  } else if (props.type === 'unpadded') {
    contentStyle = styles.fullHeader;
  } else {
    invariant(false, 'invalid ThreadSettingsCategory type');
  }
  return (
    <View>
      <View style={[styles.header, contentStyle]}>
        <Text style={styles.title}>{props.title.toUpperCase()}</Text>
      </View>
      <View style={paddingStyle} />
    </View>
  );
}

type FooterProps = {|
  +type: CategoryType,
|};
function ThreadSettingsCategoryFooter(props: FooterProps) {
  const styles = useStyles(unboundStyles);
  let contentStyle, paddingStyle;
  if (props.type === 'full') {
    contentStyle = styles.fullFooter;
    paddingStyle = styles.fullFooterPadding;
  } else if (props.type === 'outline') {
    // nothing
  } else if (props.type === 'unpadded') {
    contentStyle = styles.fullFooter;
  } else {
    invariant(false, 'invalid ThreadSettingsCategory type');
  }
  return (
    <View>
      <View style={paddingStyle} />
      <View style={[styles.footer, contentStyle]} />
    </View>
  );
}

const paddingHeight = Platform.select({
  android: 6.5,
  default: 6,
});
const unboundStyles = {
  footer: {
    marginBottom: 16,
  },
  fullFooter: {
    borderColor: 'panelForegroundBorder',
    borderTopWidth: 1,
  },
  fullFooterPadding: {
    backgroundColor: 'panelForeground',
    height: paddingHeight,
  },
  fullHeader: {
    borderBottomWidth: 1,
    borderColor: 'panelForegroundBorder',
  },
  fullHeaderPadding: {
    backgroundColor: 'panelForeground',
    height: paddingHeight,
    margin: 0,
  },
  header: {
    marginTop: 16,
  },
  title: {
    color: 'panelBackgroundLabel',
    fontSize: 12,
    fontWeight: '400',
    paddingBottom: 3,
    paddingLeft: 24,
  },
};

export { ThreadSettingsCategoryHeader, ThreadSettingsCategoryFooter };
