import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

const DefaultParameter = (command: SlashCommandSubcommandBuilder) => command
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('เลือกห้อง')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('permanent')
        .setDescription('จะส่งผล')
        .addChoices(
            {
                name: 'ถาวร',
                value: 'permanent'
            },
            {
                name: 'ชั่วคราว',
                value: 'temporary'
            }
        )
        .setRequired(true)
    )

const ConditionParameter = (command: SlashCommandSubcommandBuilder) => command
    .addIntegerOption(option => option
        .setName('delay')
        .setDescription('ระยะเวลาการกระทำ')
        .setMinValue(0)
    )
    .addStringOption(option => option
        .setName('level')
        .setDescription('เลเวลที่จำเป็นต้องมี')
    )
    .addRoleOption(option => option
        .setName('role')
        .setDescription('บทบาทที่จำเป็นต้องมี')
    )
    .addStringOption(option => option
        .setName('item-id')
        .setDescription('ไอเทมสวมใส่')
    )
    .addStringOption(option => option
        .setName('description')
        .setDescription('รายละเอียด')
    )

const GiveRole = (command: SlashCommandSubcommandBuilder) => command
    .addRoleOption(option => option
        .setName('give-role')
        .setDescription('ให้บทบาท')
        .setRequired(true)
    )

const TakeRole = (command: SlashCommandSubcommandBuilder) => command
    .addRoleOption(option => option
        .setName('take-role')
        .setDescription('ลบบทบาท')
        .setRequired(true)
    )

const VoicePermission = (command: SlashCommandSubcommandBuilder) => command
    .addChannelOption(option => option
        .setName('channel')
        .setDescription('channel')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addChannelOption(option => option
        .setName('view-channel')
        .setDescription('view-channel')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('permanent')
        .setDescription('จะส่งผล')
        .addChoices(
            {
                name: 'ถาวร',
                value: 'permanent'
            },
            {
                name: 'ชั่วคราว',
                value: 'temporary'
            }
        )
        .setRequired(true)
    )
    .addIntegerOption(option => option
        .setName('delay')
        .setDescription('ระยะเวลาการกระทำ')
    )
    .addStringOption(option => option
        .setName('level')
        .setDescription('เลเวลที่จำเป็นต้องมี')
    )
    .addRoleOption(option => option
        .setName('role')
        .setDescription('บทบาทที่จำเป็นต้องมี')
    )
    .addStringOption(option => option
        .setName('item-id')
        .setDescription('ไอเทมสวมใส่')
    )

export default new SlashCommandBuilder()
    .setName('voice_channel')
    .setDescription('...')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subCommand => subCommand
        .setName('info')
        .setDescription('แสดงรายละเอียด')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('channel')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand(subCommand => {
        subCommand.setName('assign-role')
            .setDescription('assign-role')

        GiveRole(subCommand)
        DefaultParameter(subCommand)
        ConditionParameter(subCommand)

        return subCommand
    })
    .addSubcommand(subCommand => {
        subCommand.setName('remove-role')
            .setDescription('remove-role')
        TakeRole(subCommand)
        DefaultParameter(subCommand)
        ConditionParameter(subCommand)

        return subCommand
    })
    .addSubcommand(subCommand => {
        subCommand.setName('toggle-role')
            .setDescription('toggle-role')
        
        GiveRole(subCommand)
        TakeRole(subCommand)
        DefaultParameter(subCommand)
        ConditionParameter(subCommand)

        return subCommand
    })
    .addSubcommand(subCommand => {
        subCommand
            .setName('invite')
            .setDescription('invite')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('channel')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('channel-id')
                .setDescription('channel-id')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('give-role')
                .setDescription('give-role')
            )

        ConditionParameter(subCommand)

        return subCommand
    }
    )
    .addSubcommand(subCommand => VoicePermission(subCommand)
        .setName('on-view-channel')
        .setDescription('on-view-channel')
    )
    .addSubcommand(subCommand => VoicePermission(subCommand)
        .setName('off-view-channel')
        .setDescription('off-view-channel')
    )
