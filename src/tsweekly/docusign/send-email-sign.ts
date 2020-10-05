/*
 * Copyright 2020-present Open Networking Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const docusign = require('docusign-esign');

export const signingViaEmail = exports;

signingViaEmail.controller = async (args) => {

  const envelopeArgs = {
      documentName: args.documentName,
      status: "sent",
      htmlArgs: args.htmlArgs
    },
    workerArgs = {
      accessToken: args.accessToken,
      basePath: args.basePath,
      accountId: args.accountId,
      envelopeArgs: envelopeArgs,
    }

  try {
    return await signingViaEmail.worker(workerArgs)

  } catch (error) {
    console.log(error);
  }
}

signingViaEmail.worker = async (args) => {

  const dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);

  dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + args.accessToken);
  const envelopesApi = new docusign.EnvelopesApi(dsApiClient)

  const envelope = makeEnvelope(args.envelopeArgs)

  const results = await envelopesApi.createEnvelope(
    args.accountId, {
      envelopeDefinition: envelope
    });
  const envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  return ({ envelopeId: envelopeId })
}

function makeEnvelope(args){

  const env = new docusign.EnvelopeDefinition();
  env.emailSubject = 'Please sign this document set';

  // add 1 day reminder
  const notification = new docusign.Notification();
  notification.useAccountDefaults = 'false';

  const reminders = new docusign.Reminders();
  reminders.reminderEnabled = 'true';
  reminders.reminderDelay = '1';
  reminders.reminderFrequency = '1';

  notification.reminders = reminders;
  env.notification = notification;


  const doc1 = new docusign.Document();
  doc1.documentBase64 = Buffer.from(htmlPage(args.htmlArgs)).toString('base64');
  doc1.name = "args.documentName"; // TODO :  ADD NAME
  doc1.fileExtension = 'html';
  doc1.documentId = '1';

  env.documents = [doc1];

  const signer1 = docusign.Signer.constructFromObject({
    email: args.htmlArgs.submitterEmail,
    name: args.htmlArgs.submitterName,
    recipientId: '1',
    routingOrder: '1'});

  // Signer 2 is the supervisor. Gets sent the document after signer 1 signs
  const signer2 = docusign.Signer.constructFromObject({
    email: args.htmlArgs.supervisorEmail,
    name: args.htmlArgs.supervisorName,
    recipientId: '2',
    routingOrder: '2'});

  const signHere1 = docusign.SignHere.constructFromObject({
    anchorString: '**signature_1**',
    anchorYOffset: '10', anchorUnits: 'pixels',
    anchorXOffset: '20'});

  const signHere2 = docusign.SignHere.constructFromObject({
    anchorString: '**signature_2**',
    anchorYOffset: '10', anchorUnits: 'pixels',
    anchorXOffset: '20'});

  // Tabs are set per recipient / signer
  signer1.tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1]});

  signer2.tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere2]});

  env.recipients = docusign.Recipients.constructFromObject({
    signers: [signer1, signer2],
  });
  env.status = args.status;

  return env;
}

/**
 * Creates html document
 * @function
 * @private
 * @param {Object} args parameters for the envelope:
 * @returns {string} A document in HTML format
 */

function htmlPage(args) {

  return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
          <meta charset="UTF-8"><title></title>
        </head>
        
        <body style="font-family:sans-serif;margin-left:2em;">
        
        <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            color: darkblue;margin-bottom: 0;">${args.submitterName}: ${args.submitterEmail}</h1>
            
        <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          margin-top: 0;margin-bottom: 3.5em;font-size: 1em;
          color: darkblue;">Timesheet Week no: ${args.week.weekNo}</h2>
          
        <h4>Week: ${args.week.begin} - ${args.week.end}</h4>
        
        <p style="margin-top:0; margin-bottom:0;">Supervisor: ${args.supervisorName}, ${args.supervisorEmail}</p>
        
        <table style="width: 100%; font-family:sans-serif;text-align: center;border-spacing:2px;border-color:grey;line-height:1.5;">
        
        <thead style="vertical-align: middle;">
            <tr>
              <th scope="col" colspan="9" style="padding: 9px 20px 0;font-size:1.1em;border-bottom: 2px solid #6678b1;">Hours</th>
            </tr>
        </thead>
        
        <tbody>
            <tr>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;"></td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">Mon
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Tue</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">Wed
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Thu</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">Fri
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Sat</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">Sun
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Total</td>
            </tr>
            
            <tr>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Darpa HR001120C0107</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[0][0]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[1][0]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[2][0]}
                  <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[3][0]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[4][0]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[5][0]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[6][0]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[7][0]}
              </td>
            </tr>
            
            <tr>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Non Darpa</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[0][1]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[1][1]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[2][1]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[3][1]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[4][1]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[5][1]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[6][1]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[7][1]}
              </td>
            </tr>
            
            <tr>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Sick</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[0][2]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[1][2]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[2][2]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[3][2]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[4][2]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[5][2]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[6][2]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[7][2]}
              </td>
            </tr>
            
            <tr>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">PTO</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[0][3]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[1][3]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[2][3]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[3][3]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[4][3]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[5][3]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[6][3]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[7][3]}
              </td>
            </tr>
            
            <tr>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">Holiday</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[0][4]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[1][4]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[2][4]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[3][4]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[4][4]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[5][4]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[6][4]}
                <span style="color:white;"></span>
              </td>
              <td style="padding: 9px 8px 0;border-bottom: 1px solid #667;">${args.hours[7][4]}
              </td>
            </tr>
            
            <tr>
              <td style="padding: 9px 8px 0; border-bottom: 2px solid #6678b1;">Total</td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[0][5]}
                <span style="color:white;"></span>
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[1][5]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[2][5]}
                <span style="color:white;"></span>
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[3][5]}
              </td
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[4][5]}
                <span style="color:white;"></span>
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[5][5]}
              </td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[6][5]}
                <span style="color:white;"></span></td>
              <td style="text-align: center; padding: 9px 8px 0;border-bottom: 2px solid #6678b1;">${args.hours[7][5]}
              </td>
            </tr>
        </tbody>
    </table>
    
        <!-- Note the anchor tag for the signature field is in white. -->
        <h3 style="margin-top:3em;">Submitter: <span style="color:white;">**signature_1**</span></h3>
        <h3 style="margin-top: 3em;">Supervisor: <span style="color:white;">**signature_2**</span></h3>
        </body>
    </html>
  `
}