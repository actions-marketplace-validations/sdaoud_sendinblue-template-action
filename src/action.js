const core = require("@actions/core");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const path = require("path");
const fs = require("fs");
const templateDir = core.getInput("templates");
const senderName = core.getInput("SENDER_NAME");
const senderEmail = core.getInput("SENDER_EMAIL");
const replyTo = core.getInput("REPLY_TO");
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = core.getInput("SENDINBLUE_API_KEY");
const api = new SibApiV3Sdk.TransactionalEmailsApi();

async function getTemplatesNames() {
  const dir = await fs.promises.opendir(templateDir);
  const ret = [];
  for await (const dirent of dir) {
    const file = path.parse(dirent.name);
    if (file.ext !== ".html") {
      continue;
    }
    ret.push(file.name);
  }
  return ret;
}

async function run() {
  const templateNames = await getTemplatesNames();
  const templates = await getTemplatesByName(templateNames);
  Object.entries(templates).map(async ([templateName, template]) => {
    const action = template ? updateTemplate : createTemplate;
    console.log(
      `${template ? "Updating" : "Creating"} ${templateName} template...`
    );
    const { error } = await action({
      [templateName]: templates[templateName],
    });
    console.log(error ? `Error: ${error}` : "Success");
  });
}

async function buildTemplate(template) {
  const [templateName] = Object.keys(template);
  const data = fs
    .readFileSync(`${templateDir}/${templateName}.html`, "utf8")
    .toString();
  const regex = /<!-- subject:([\s\S]*?) -->/gim;
  const matches = regex.exec(data);
  const subject = matches && matches[1] ? matches[1].trim() : templateName;

  const smtpTemplate = new SibApiV3Sdk.CreateSmtpTemplate();
  smtpTemplate.sender = { name: senderName, email: senderEmail };
  smtpTemplate.templateName = templateName;
  smtpTemplate.htmlContent = data;
  smtpTemplate.subject = subject;
  smtpTemplate.replyTo = replyTo;
  smtpTemplate.isActive = true;
  return smtpTemplate;
}

async function updateTemplate(template) {
  const [currentTemplate] = Object.values(template);
  const smtpTemplate = await buildTemplate(template);
  try {
    const req = await api.updateSmtpTemplate(currentTemplate.id, smtpTemplate);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function createTemplate(template) {
  const smtpTemplate = await buildTemplate(template);
  try {
    await api.createSmtpTemplate(smtpTemplate);
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function getTemplatesByName(names) {
  const request = await api.getSmtpTemplates();
  const { templates } = request;
  return names.reduce((agg, x) => {
    const template = templates ? templates.find((t) => t.name === x) : false;
    agg[x] = template || false;
    return agg;
  }, {});
}

run();
