import { EmbedBuilder, GuildMember, MessageCreateOptions, codeBlock } from "discord.js";
import { ItemParameter, IUser, StatusType, TypeAB } from "../../../types";
import { ErrorEmbeds } from "../../../Utils/Components";

const AttackMessage = async (AttHP: number, AttMP: number, Target: GuildMember) => {
    const Message: MessageCreateOptions = {
        embeds: [
            new EmbedBuilder()
                .setDescription(`<@${Target.id}>${codeBlock(`${AttHP >= 0 ? '🟢' : '🔴'}HP🩸 : ${AttHP}\n${AttMP >= 0 ? '🟢' : '🔴'}MP✨ : ${AttMP}`)}`)
        ]
    }

    try {
        const ChannelMessage = await Target.voice.channel?.send(Message)
        const DMMessage = await Target.user.send(Message)

        setTimeout(async () => {
            ChannelMessage?.delete()
            DMMessage?.delete()
        }, 10_000)
    } catch {
        
    }
}

export default async ({ client, Member, ItemTarget, interaction, Target, AcceptCheck = false }: ItemParameter): Promise<StatusType> => {
    const User: IUser = await client.Database.Users.findOne({ UserId: Member.id }) as any
    const Item = await client.Database.Items(ItemTarget.ItemId) as TypeAB

    if (Target) {
        if (Member.voice.channel !== Target.voice.channel) return { isEnd: false, message: { embeds: [ErrorEmbeds.ChannelNotMatch(Target.user.id)] } }
    }

    let ConditionOpenItem = await client.Executer.ConditionOpenItem(User, Member, Item, Item.Extend.ConditionItem, interaction, Target)

    if (ConditionOpenItem.isEnd) return ConditionOpenItem

    let Quality = await client.Executer.DecreaseAttriute(ItemTarget, Item)

    if (!Target) {
        let Passive = await client.Executer.Passive(interaction, User.UserId, ItemTarget, Item.Extend.PassiveTarget, Quality)

        if (Passive.isEnd) return Passive

        await client.Executer.Activate(User, Member, Item.Extend.Activate)
    } else {
        const target: IUser = await client.Database.Users.findOne({ UserId: Target.id }) as any

        let ConditionTarget = await client.Executer.ConditionTarget(target, Target, Item)

        if (ConditionTarget.isEnd) return ConditionTarget

        const { IQ, AttHP, AttMP } = await client.Executer.Attack(Member.guild, User, Item.Extend.Activate, target, ItemTarget.Quality, Item.Extend.ConditionTarget)

        AttackMessage(AttHP, AttMP, Target)

        Quality = IQ

        let PassiveMe = await client.Executer.Passive(interaction, Member.user.id, ItemTarget, Item.Extend.PassiveMe, Quality)

        if (PassiveMe.isEnd) return PassiveMe

        let PassiveTarget = await client.Executer.Passive(interaction, Target.user.id, ItemTarget, Item.Extend.PassiveTarget, Quality, !AcceptCheck)

        if (PassiveTarget.isEnd) return PassiveTarget

        await client.Executer.Activate(target, Member, Item.Extend.Activate)
    }

    if (ConditionOpenItem.MPUse) {
        let Id = AcceptCheck ? Target?.id : Member.id

        await client.Database.Users.updateOne({ UserId: Id }, {
            $inc: { 'stats.MP.value': -ConditionOpenItem.MPUse }
        })
    }

    try {
        if ((Item.ConditionItem.FinishMessage || {}).EveryOneCanSee) {
            await interaction.deleteReply()
            await interaction.channel?.send(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' }).then(message => setTimeout(() => message.delete(), 10_000))
        }
        else await interaction.editReply(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' })

        if (!Target || AcceptCheck) await Member.send(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' })

    } catch { }
    return { isEnd: false }
}