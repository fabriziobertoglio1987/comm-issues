// @flow

import type { AccessRequest } from 'lib/types/account-types';

import React from 'react'
import ReactHTML from 'react-html-email';
import _shuffle from 'lodash/fp/shuffle';

import ashoat from 'lib/facts/ashoat';

import sendmail from './sendmail';
import Template from './template.react';

const { Item, Span, renderEmail } = ReactHTML;

const someHeadings = [
  "What is UP my man??",
  "Ayy this that code you wrote",
  "I am a digital extension of your self",
  "We got some news, bud-dy!",
];

async function sendAccessRequestEmailToAshoat(
  request: AccessRequest,
): Promise<void> {
  const heading = _shuffle(someHeadings)[0];
  const title = "Somebody wants SquadCal!";
  const email = (
    <Template title={title}>
      <Item align="left">
        <Span fontSize={24}>
          {heading}
        </Span>
      </Item>
      <Item align="left">
        <Span>
          {`${request.email} wants the ${request.platform} app.`}
        </Span>
      </Item>
    </Template>
  );
  const html = renderEmail(email);

  sendmail.sendMail({
    from: "no-reply@squadcal.org",
    to: ashoat.email,
    subject: title,
    html,
  });
}

export {
  sendAccessRequestEmailToAshoat,
};
