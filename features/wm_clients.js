var WorkflowMax = require('workflowmax');
var xml2js = require('xml2js');

// API instance
const wfm = new WorkflowMax({
  apiKey: process.env.WM_API_KEY,
  accountKey: process.env.WM_ACCOUNT_KEY,
});

// TODO: Implement error handling for clientSearch.
async function clientSearch(keyword) {
  let wfm_result

  // Query the WorkflowMax API.
  try {
    wfm_result = await wfm.api['client'].search([{ name: 'query', value: keyword}])
  } catch(e) {
    wfm_result = await console.log('Error:', e)
  }

  let clients

  // Parse the XML response to something usable.
  try {
    clients = await xml2js.parseStringPromise(wfm_result, {explicitArray: true})
      .then(function (result) {
        return result.Response.Clients[0].Client;
      });
  } catch(e) {
    clients = await console.log('Error:', e)
  }

  // Return a rich block result if clients are found.
  if (Array.isArray(clients) && clients.length) {

    let blocks = {
      blocks: [
          {
              "type": "section",
              "text": {
                  "type": "mrkdwn",
                  "text": "I found *" + clients.length + "* clients based on a search of *" + keyword + "*."
              }
          },
          {
            "type": "divider"
          },
        ]
    };

    for (var i = 0; i < clients.length; i++) {

      let name = clients[i].Name
      let id = clients[i].ID
      let account_manager = clients[i].AccountManager[0].Name
      let hyperlink = "https://practicemanager.xero.com/Client/" + id + "/Detail"

      let client_block = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*<${hyperlink}|${name}>*\n*Account Manager*: ${account_manager}\n`
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Jobs"
            },
            "action_id": "getJobs",
            "value": `${id}`
          }
      }

      let custom_fields_block = {
          "type": "section",
          "fields": await getCustomFields('client', id)
      }

      let divider = {
        "type": "divider"
      }

      blocks.blocks.push(client_block);
      blocks.blocks.push(custom_fields_block);
      blocks.blocks.push(divider);
    }

    return blocks;
  } else {
    return "I didn't find any records based on your search of *" + keyword + "*."
  }
}

async function getClientJobs(clientID) {
  let wfm_result

  // Getting client contact details by contact id
  const entity = 'job'
  const method = 'client'

  // Query the WorkflowMax API.
  try {
    wfm_result = await wfm.api.job.rawGet(method + '/' + clientID)
  } catch(e) {
    wfm_result = await console.log('Error:', e)
  }

  let jobs

  // Parse the XML response to something usable.
  try {
    jobs = await xml2js.parseStringPromise(wfm_result, {explicitArray: true})
      .then(function (result) {
        return result.Response.Jobs[0].Job;
      });
  } catch(e) {
    jobs = await console.log('Error:', e)
  }

  // Return a rich block result if jobs are found.
  if (Array.isArray(jobs) && jobs.length) {

    let blocks = {
      blocks: [
          {
              "type": "section",
              "text": {
                  "type": "mrkdwn",
                  "text": "I found *" + jobs.length + "* jobs for the client."
              }
          },
          {
            "type": "divider"
          },
        ]
    };

    for (var i = 0; i < jobs.length; i++) {

      let name = jobs[i].Name
      let id = jobs[i].InternalID
      let state = jobs[i].State[0]
      let type = jobs[i].Type
      let hyperlink = "https://my.workflowmax.com/job/jobview.aspx?id=" + id

      if (state === 'Completed') {
        continue;
      }

      let job_block = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*<${hyperlink}|${name}>*`
          }
      }

      let custom_fields = await getCustomFields('job', jobs[i].ID);
      custom_fields.push({
        "type": "mrkdwn",
        "text": `*State*\n${state}`
      })
      custom_fields.push({
        "type": "mrkdwn",
        "text": `*Type*\n${type}`
      })
      let custom_fields_block = {
          "type": "section",
          "fields": custom_fields
      }

      let divider = {
        "type": "divider"
      }

      blocks.blocks.push(job_block);
      blocks.blocks.push(custom_fields_block);
      blocks.blocks.push(divider);
    }
    return blocks
  } else {
    return "I didn't find any jobs for the client."
  }

}

async function getCustomFields(entity, id) {

  return await wfm.api.raw.get(entity, 'get' + '/' + id + '/customfield')
    .then(result => {

      return xml2js.parseStringPromise(result, {explicitArray: true})
        .then(function (result) {

          let fields = result.Response.CustomFields[0].CustomField;
          let field_values = [];

          if (Array.isArray(fields) && fields.length) {
            for (var f = 0; f < fields.length; f++) {

              if (fields[f].Text != null) { // Text field
                text = fields[f].Text;
              } else if (fields[f].Number != null) { // Number field
                text = fields[f].Number;
              } else { // Date field
                text = fields[f].Date;
              }

              let field = {
                "type": "mrkdwn",
                "text": `*${fields[f].Name}*\n${text}`
              }

              field_values.push(field);
            }
          }

          return field_values;

        });
    })
    .catch(error => {
      console.log('Error:', error)
    })
}

module.exports = function(controller) {

  controller.on('slash_command', async(bot, message) => {
    await bot.reply(message, await clientSearch(message.text));
  });

  controller.on('block_actions', async (bot, message) => {

    let action = message.incoming_message.channelData.actions[0];

    switch (action.action_id) {
      case 'getJobs':
        // TODO: Ideally this response is in a thread (or similar).
        await bot.replyInThread(message, await getClientJobs(action.value));
      break;
    }
  });

}
