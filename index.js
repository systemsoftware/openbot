const { Client, GatewayIntentBits, ActivityType, REST, SlashCommandBuilder, Routes, EmbedBuilder } = require("discord.js")
const { discord_BOT_token, discord_BOT_ID, openai_API_token, max_tokens, command_name, command_description } = require("./config.json")
const { Configuration, OpenAIApi } = require("openai")
const discordClient = new Client({ "presence":{ "activities":[ { "name":"for /ai", type:ActivityType.Watching } ] }, intents:[ GatewayIntentBits.Guilds ]  })
const config = new Configuration({ "apiKey":openai_API_token })
const openai = new OpenAIApi(config);

const register = async () => {
const models = (await openai.listModels()).data.data
const MODELS = []
let c = 0
models.forEach(model => {
if(c > 24) return
const name = model.id.split("-").join(" ").toUpperCase()
MODELS.push({ name, value:model.id })
c++
})
new REST({ version:"10" }).setToken(discord_BOT_token).put(Routes.applicationCommands(discord_BOT_ID), { body:[ 
new SlashCommandBuilder().setName(command_name).setDescription(command_description)
.addStringOption(o => o.setName("model").setDescription("Which model to use").setRequired(true).addChoices(...MODELS)) // model
.addStringOption(o => o.setName("prompt").setDescription("AI prompt").setRequired(true)) // prompt 
.addNumberOption(o => o.setName("max_tokens").setDescription("Max tokens to generate").setMaxValue(max_tokens).setRequired(false)) // prompt 
.addNumberOption(o => o.setName("temperature").setMinValue(0).setMaxValue(1).setDescription("Lowering will result in a less random response").setRequired(false)) // temperature
.addNumberOption(o => o.setName("top_p").setMinValue(0).setMaxValue(1).setDescription("Controls diversity via nucleus sampling.").setRequired(false)) // top p
.addNumberOption(o => o.setName("frequency_penalty").setMinValue(0).setMaxValue(1).setDescription("Decreases the model's likelihood to repeat the same line.").setRequired(false)) // frequency penalty
.addNumberOption(o => o.setName("presence_penalty").setMinValue(0).setMaxValue(1).setDescription("Increases the model's likelihood to talk about new topics.").setRequired(false)) // presence penalty
.addBooleanOption(o => o.setName("ephemeral").setDescription("Send as an ephemeral message?").setRequired(false))


] })
.then(() => console.log('Successfully registered application commands.'))
.catch(console.error)
}

discordClient.on("interactionCreate", async i => {
i.deferReply({ ephemeral:i.options.getBoolean("ephemeral") ? true : false  })
try{
const opt = (name, type) => type == "num" ?  i.options.getNumber(name) : i.options.getString(name)
openai.createCompletion({
  model: opt("model", "string"),
  prompt: opt('prompt',"string"),
  temperature: opt('temperature', "num") || 0,
  max_tokens: opt('max_tokens', "num") || max_tokens,
  top_p: opt('top_p', "num") || 0,
  frequency_penalty: opt('frequency_penalty', "num") || 0,
  presence_penalty: opt('presence_penalty', "num") || 0,
}).then(res => {
const em = new EmbedBuilder()
.setAuthor({ name:"OpenAI", "iconURL":"https://openai.com/content/images/size/w256h256/2020/09/icon-1.png" })
.setTitle(opt("prompt","string"))
.setDescription(`${res.data.choices[0].text}`)
.setFooter({ text:`Tokens: ${res.data.usage.total_tokens} (Prompt: ${res.data.usage.prompt_tokens}, Completion: ${res.data.usage.completion_tokens})` })
.setColor("Random")
i.followUp({ embeds:[em], ephemeral:i.options.getBoolean("ephemeral") ? true : false })
})
}catch (err) {
i.followUp({ content:new Error(err).message, ephemeral:true })
}
})

if(!process.argv[2].toLowerCase().includes('nopub')) register()
discordClient.login(discord_BOT_token)

module.exports = discordClient
