import { CommandInteraction, EmbedBuilder, GuildMember, RoleSelectMenuBuilder, SlashCommandBuilder, codeBlock } from "discord.js"
import Client from "../../structure/Client"
import Inventory from "../../handlers/inventory/Inventory"

export default {
    data: [
        new SlashCommandBuilder()
            .setName('admin')
            .setDescription('คำสั่งแอดมิน')
            .addSubcommand(SubCommand => SubCommand
                .setName('inventory')
                .setDescription('มิติเก็บไอเทม')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('เลือก user')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('show')
                    .setDescription('ต้องการแสดงให้คนอื่นเห็นไหม')
                    .addChoices(
                        {
                            name: 'ไม่แสดง',
                            value: 'true'
                        },
                        {
                            name: 'แสดง',
                            value: 'false'
                        }
                    )
                    .setRequired(false)
                )
            )
            .addSubcommand(SubCommand => SubCommand
                .setName('query')
                .setDescription('query')
                .addStringOption(option => option
                    .setName('collection')
                    .setDescription('เลือก collection')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('method')
                    .setDescription('เลือก method')
                    .addChoices(
                        {
                            name: 'find',
                            value: 'find'
                        },
                        {
                            name: 'insertMany',
                            value: 'insertMany'
                        },
                        {
                            name: 'updateMany',
                            value: 'upddateMany'
                        },
                        {
                            name: 'aggregate',
                            value: 'aggregate'
                        }
                    )
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('data')
                    .setDescription('data')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('option')
                    .setDescription('option')
                    .setRequired(false)
                )
            )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: 'คุณไม่มีสิทธิใช้คำสั่งนี้' })

        const { options } = interaction

        const Command = options.data[0].name

        if (Command == 'inventory') {
            const user = options.getMember('user') as GuildMember
            const ephemeral = (interaction.options.get('show')?.value === undefined) ? true : (interaction.options.get('show')?.value == 'true')

            await interaction.deferReply({ ephemeral: ephemeral })

            new Inventory(client, user.user.id, interaction)
        }

        if (Command == 'query') {
            try {
                const collectionName = options.get('collection')?.value as string
                const method = options.get('method')?.value as 'find' | 'insertMany' | 'updateMany' | 'aggregate'
                const data = options.get('data')?.value as any
                const option = options.get('option')?.value as any

                const JSON_DATA = JSON.parse(data || '{}')
                const JSON_OPTION = JSON.parse(option || '{}')

                let result

                const collection = client.Database.connection.collection(collectionName)
                switch (method) {
                    case 'find':
                        result = await collection.find(JSON_DATA).toArray()
                        break;
                    case 'insertMany':
                        result = await collection.insertMany(JSON_DATA)
                        break;
                    case 'updateMany':
                        result = await collection.updateMany(JSON_DATA, JSON_OPTION)
                        break;
                    case 'aggregate':
                        result = await collection.aggregate(JSON_DATA, JSON_OPTION).toArray()
                        break;
                }

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Collection : ${collectionName}`)
                            .setDescription(`Query: db.${collectionName}.${method}(${JSON.stringify(JSON_DATA)}, ${JSON.stringify(JSON_OPTION)})`)
                    ],
                    content: `${codeBlock('json', `${JSON.stringify(result)}`)}`
                })
            } catch (err) {
                console.log(err)

                interaction.reply({ content: `Error : ${err}`, ephemeral: true })
            }
        }
    }
}