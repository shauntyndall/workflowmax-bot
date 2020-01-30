# WorkflowMax + Slack

This is a Botkit based bot that provides information from WorkflowMax to be accessed within Slack.

`/wfm [keyword]` returns a search result of clients with `Jobs` action button to return list of incomplete jobs for client.
`/wfm leads [category]` returns a list of leads that matches category.
`/wfm help` return basic help information.

WorkflowMax custom fields are returned when clients or jobs are presented.

# Contributing

- Checkout repository
- `ngrok http 3000`
- `npm install`
- `npm start`
- Copy ngrok url into api.slack.com app configuration.


## TODO

- [ ] Add solution to allow app storage of WorkflowMax API keys. The goal is to make the app shareable to other teams.
- [ ] Provide mechanism to record timesheet entry.
- [ ] Define local development procedures.
