export type ActionType = 'assign-role' | 'remove-role' | 'toggle-role'
export enum VoiceType {
    Simple = 'simple',
    Invite = 'invite',
    Permission = 'permission',
    UseItem = 'use_item'
}
type Permanent = 'permanent' | 'temporary'

interface VoiceBase {
    ActionId: string
    guildId: string
    channelId: string
}

interface RequireBase {
    permanent: Permanent
    delay?: number
    level?: string
    roleId?: string
    itemId?: string
    description?: string
}

export interface SimpleVoice extends VoiceBase, RequireBase {
    VoiceType: VoiceType.Simple
    giveId?: string
    takeId?: string
}

export interface InviteVoice extends VoiceBase {
    VoiceType: VoiceType.Invite
    channelInvite: string
    giveId?: string
    delay?: number
    level?: string
    roleId?: string
    itemId?: string
    description?: string
}

export interface PermissionVoice extends VoiceBase, RequireBase {
    VoiceType: VoiceType.Permission
    action: 'add' | 'remove'
    viewId: string
}