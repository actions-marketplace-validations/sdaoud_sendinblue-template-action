# Sendinblue Template Action

A github action for creating and updating Sendinblue email templates programtically

## Usage

Setup the action:

```yaml
steps:
  - uses: Batchly-Ltd/sendinblue-template-action
    with:
      SENDINBLUE_API_KEY: ${{secrets.SENDINBLUE_API_KEY}}
      SENDER_NAME: "John Smith"
      SENDER_EMAIL: "john@smith.com"
      REPLY_TO: "no-reply@smith.com"
      templates: ./templates
```

## templates

The `templates` variable should point to a directory of HTML templates to upload. This action will check for existing templates with the same name and update them, or create a new one.

You can set the subject line of each template with the following HTML code:

```
<!-- subject: Put your subject here -->
```
