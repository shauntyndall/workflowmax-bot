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
    wfm_result = await wfm.api['client'].search([{
      name: 'query',
      value: keyword
    }])
  } catch (e) {
    wfm_result = await console.log('Error:', e)
  }

  let clients

  // Parse the XML response to something usable.
  try {
    clients = await xml2js.parseStringPromise(wfm_result, {
        explicitArray: true
      })
      .then(function(result) {
        return result.Response.Clients[0].Client;
      });
  } catch (e) {
    clients = await console.log('Error:', e)
  }

  // Return a rich block result if clients are found.
  if (Array.isArray(clients) && clients.length) {

    let blocks = {
      blocks: [{
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

      let custom_fields = await getCustomFields('client', id);
      let custom_fields_block = {
        "type": "section",
        "fields": custom_fields
      }

      let divider = {
        "type": "divider"
      }

      blocks.blocks.push(client_block);

      if (custom_fields.length) {
        blocks.blocks.push(custom_fields_block);
      }

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
  } catch (e) {
    wfm_result = await console.log('Error:', e)
  }

  let jobs

  // Parse the XML response to something usable.
  try {
    jobs = await xml2js.parseStringPromise(wfm_result, {
        explicitArray: true
      })
      .then(function(result) {
        return result.Response.Jobs[0].Job;
      });
  } catch (e) {
    jobs = await console.log('Error:', e)
  }

  // Return a rich block result if jobs are found.
  if (Array.isArray(jobs) && jobs.length) {

    let blocks = {
      blocks: [{
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

      return xml2js.parseStringPromise(result, {
          explicitArray: true
        })
        .then(function(result) {

          let fields = result.Response.CustomFields[0].CustomField;
          let field_values = [];

          if (Array.isArray(fields) && fields.length) {
            for (var f = 0; f < fields.length; f++) {

              if (fields[f].Text != null) { // Text field
                text = fields[f].Text;
              } else if (fields[f].Number != null) { // Number field
                text = fields[f].Number;
              } else if (fields[f].Decimal != null) { // Decimal field
                text = "$" + fields[f].Decimal;
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

async function getLeads(category = '') {
  let wfm_result

  // Query the WorkflowMax API.
  try {
    wfm_result = await wfm.api['lead'].current()
  } catch (e) {
    wfm_result = await console.log('Error:', e)
  }

  let leads

  // Parse the XML response to something usable.
  try {
    leads = await xml2js.parseStringPromise(wfm_result, {
        explicitArray: true
      })
      .then(function(result) {
        return result.Response.Leads[0].Lead;
      });
  } catch (e) {
    clients = await console.log('Error:', e)
  }

  // Return a rich block result if clients are found.
  if (Array.isArray(leads) && leads.length) {

    let blocks = {
      blocks: [{
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "I found *" + leads.length + "* current leads, only displaying those with category '" + category + "'."
          }
        },
        {
          "type": "divider"
        },
      ]
    };

    for (var i = 0; i < leads.length; i++) {

      let name = leads[i].Name
      let id = leads[i].ID
      let dropbox = leads[i].Dropbox
      let lead_category = leads[i].Category[0]
      let client_name = leads[i].Client[0].Name[0]
      let staff_name = leads[i].Owner[0].Name[0]
      let hyperlink = "https://my.workflowmax.com/lead/view.aspx?id=" + id

      if (lead_category.toLowerCase() != category.toLowerCase()) {
        continue;
      }

      let lead_block = {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*<${hyperlink}|${name}>*`
        }
      }

      let custom_fields = [];
      custom_fields.push({
        "type": "mrkdwn",
        "text": `*Client*\n${client_name}`
      })
      custom_fields.push({
        "type": "mrkdwn",
        "text": `*Owner*\n${staff_name}`
      })
      custom_fields.push({
        "type": "mrkdwn",
        "text": `*Category*\n${lead_category}`
      })
      custom_fields.push({
        "type": "mrkdwn",
        "text": `*Dropbox*\n<mailto:${dropbox}|Copy Email Address>`
      })
      let custom_fields_block = {
        "type": "section",
        "fields": custom_fields
      }

      let divider = {
        "type": "divider"
      }

      blocks.blocks.push(lead_block);
      blocks.blocks.push(custom_fields_block);
      blocks.blocks.push(divider);
    }

    return blocks;
  } else {
    return "I didn't find any current leads."
  }

}

async function help() {

  help_text = "Use `/wfm` to query WorkflowMax for clients, jobs and leads. Some examples include:"
  help_text += "\n - `/wfm [keyword]` searches for clients matching the keyword."
  help_text += "\n - `/wfm leads [category]` returns a list of leads matching the category."
  help_text += "\n"
  help_text += "\nJobs can be access via the client search results."

  let blocks = {
    blocks: [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Need some help with `/wfm`?"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": help_text
        }
      },
      {
        "type": "divider"
      },
    ]
  };

  return blocks;
}

module.exports = function(controller) {

  controller.on('slash_command', async (bot, message) => {

    let words = message.text.split(" ");

    switch (words[0]) {
      case '':
      case 'help':
        await bot.replyEphemeral(message, await help());
        break;
      case 'lead':
      case 'leads':
        await bot.reply(message, await getLeads(words[1]));
        break;
      default:
        await bot.reply(message, await clientSearch(message.text));
    }

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
