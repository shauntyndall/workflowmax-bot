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

      // TODO: Add accessory block with "jobs" button.
      let client_block = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `<${hyperlink}|${name}>\n${account_manager}`
          }
      }

      blocks.blocks.push(client_block);
    }

    return blocks;
  } else {
    return "I didn't find any records based on your search of *" + keyword + "*."
  }
}

module.exports = function(controller) {

  controller.on('slash_command', async(bot, message) => {
    await bot.reply(message, await clientSearch(message.text));
  });

}
